# Deployment Instructions (AWS Lambda)

## Prerequisites
1. **Node.js**: Install Node.js to use the Serverless Framework.
2. **AWS CLI**: Install and configure with your credentials (`aws configure`).
3. **Docker**: (Optional but recommended) Used by Serverless to package Python dependencies.

## Steps

1. **Install Serverless Framework**:
   ```bash
   npm install -g serverless
   ```

2. **Navigate to Backend**:
   ```bash
   cd backend
   ```

3. **Install Serverless Python Plugin**:
   ```bash
   sls plugin install -n serverless-python-requirements
   ```

4. **Deploy**:
   Run the deploy command. This will zip your code, create the Lambda function, and set up API Gateway.
   ```bash
   sls deploy
   ```

5. **Get the URL**:
   After deployment, you will see an output like:
   ```
   endpoints:
     ANY - https://xyz123.execute-api.us-east-1.amazonaws.com/dev/{proxy+}
   ```
   Copy the base URL (e.g., `https://xyz123.execute-api.us-east-1.amazonaws.com/dev`).

6. **Update Extension**:
   - Open `extension/popup.js`.
   - Update `backendUrl` with your new AWS URL.
   - Open `extension/manifest.json`.
   - Update `host_permissions` to include your new AWS URL (e.g., `https://*.amazonaws.com/*`).

7. **Reload Extension**:
   - Go to `chrome://extensions`.
   - Click the reload icon on your extension.

## Environment Variables
The `serverless.yml` file is configured to use environment variables from your local machine.
Make sure you export them before deploying:
```bash
export OPENAI_API_KEY=sk-...
export PINECONE_API_KEY=...
export PINECONE_INDEX_NAME=page-mind
sls deploy
```
