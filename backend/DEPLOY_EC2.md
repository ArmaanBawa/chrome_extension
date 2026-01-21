# Deploying to AWS EC2

This guide explains how to deploy your FastAPI backend to an AWS EC2 instance.

## Option 1: Using Docker (Recommended)

1.  **Launch an EC2 Instance**:
    *   **AMI**: Ubuntu Server 24.04 LTS (HVM) or Amazon Linux 2023.
    *   **Instance Type**: t2.micro (Free Tier eligible) or larger.
    *   **Security Group**: Allow **SSH (22)** and **Custom TCP (8000)** from Anywhere (0.0.0.0/0).

2.  **Connect to your instance**:
    ```bash
    ssh -i /path/to/key.pem ubuntu@your-ec2-public-ip
    ```

3.  **Install Docker**:
    ```bash
    # Update packages
    sudo apt-get update
    sudo apt-get install -y docker.io git

    # Start Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add user to docker group (avoids sudo)
    sudo usermod -aG docker $USER
    # Log out and log back in for group changes to take effect
    exit
    ssh -i /path/to/key.pem ubuntu@your-ec2-public-ip
    ```

4.  **Clone your repository**:
    ```bash
    git clone <your-repository-url>
    cd extension/backend
    ```
    *(Note: You might need to generate an SSH key on EC2 and add it to GitHub, or use HTTPS with a token)*

5.  **Build and Run**:
    ```bash
    # Build the image
    docker build -t page-mind-backend .

    # Run the container (detached mode)
    docker run -d \
      -p 8000:8000 \
      -e OPENAI_API_KEY="sk-..." \
      -e PINECONE_API_KEY="pcsk_..." \
      -e PINECONE_INDEX_NAME="page-mind" \
      --name backend \
      page-mind-backend
    ```

6.  **Verify**:
    Visit `http://your-ec2-public-ip:8000/` in your browser.

## Option 2: Running Directly (No Docker)

1.  **Install Python and Dependencies**:
    ```bash
    sudo apt-get update
    sudo apt-get install -y python3-pip python3-venv git
    ```

2.  **Clone and Setup**:
    ```bash
    git clone <your-repository-url>
    cd extension/backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Run**:
    ```bash
    export OPENAI_API_KEY="sk-..."
    export PINECONE_API_KEY="pcsk_..."
    export PINECONE_INDEX_NAME="page-mind"
    
    # Run in background with nohup
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 &
    ```

## Post-Deployment Steps

1.  **Update Extension**:
    *   Update `extension/popup.js` with your EC2 public IP (e.g., `http://54.123.45.67:8000`).
    *   Update `extension/manifest.json` host permissions.
