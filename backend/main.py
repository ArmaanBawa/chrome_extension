import os
import uvicorn
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.document_loaders import WebBaseLoader
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.chains.summarize import load_summarize_chain
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
from langchain.chains import RetrievalQA
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "page-mind")

# Ensure index exists (optional, but good for UX)
if INDEX_NAME not in [index.name for index in pc.list_indexes()]:
    # This is a basic creation script. In production, you might manage this outside the app code
    try:
        pc.create_index(
            name=INDEX_NAME,
            dimension=1536, # OpenAI embedding dimension
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            ) 
        )
    except Exception as e:
        print(f"Could not create index: {e}")

class SummaryRequest(BaseModel):
    url: str

class ChatRequest(BaseModel):
    url: str
    question: str
    history: Optional[List[str]] = []

def get_llm():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not found in environment variables.")
    # gpt-4o-mini is faster and cheaper, falling back to gpt-3.5-turbo if needed
    return ChatOpenAI(temperature=0, model_name="gpt-4o-mini")

def get_vectorstore(namespace: str):
    embeddings = OpenAIEmbeddings()
    return PineconeVectorStore.from_existing_index(
        index_name=INDEX_NAME,
        embedding=embeddings,
        namespace=namespace
    )

def process_vectors_background(url: str, docs):
    """
    Background task to process embeddings and upload to Pinecone.
    This runs after the summary response is sent to the user.
    """
    try:
        import hashlib
        namespace = hashlib.md5(url.encode()).hexdigest()
        
        embeddings = OpenAIEmbeddings()
        
        # We need to split into smaller chunks for vector storage (retrieval needs smaller chunks than summarization)
        retrieval_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        retrieval_docs = retrieval_splitter.split_documents(docs)
        
        PineconeVectorStore.from_documents(
            documents=retrieval_docs,
            embedding=embeddings,
            index_name=INDEX_NAME,
            namespace=namespace
        )
        print(f"Successfully processed vectors for {url}")
    except Exception as e:
        print(f"Error in background vector processing: {e}")

@app.get("/")
def read_root():
    return {"message": "Page Mind API is running with Pinecone"}

@app.post("/summary")
async def summarize(request: SummaryRequest, background_tasks: BackgroundTasks):
    try:
        loader = WebBaseLoader(request.url)
        docs = loader.load()
        
        llm = get_llm()
        chain = load_summarize_chain(llm, chain_type="stuff")
        summary = chain.run(docs)
        
        # Trigger background vector processing
        background_tasks.add_task(process_vectors_background, request.url, docs)
        
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        import hashlib
        namespace = hashlib.md5(request.url.encode()).hexdigest()
        
        vectorstore = get_vectorstore(namespace)
        llm = get_llm()
        
        qa = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vectorstore.as_retriever()
        )
        
        response = qa.run(request.question)
        return {"answer": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)


