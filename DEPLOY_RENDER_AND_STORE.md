# Deployment Guide: Render & Chrome Web Store

This guide explains how to deploy your backend to Render and publish your extension to the Chrome Web Store.

---

## Part 1: Deploy Backend to Render

Render is a cloud platform that makes it easy to deploy web services.

### Option A: Using `render.yaml` (Infrastructure as Code)

1.  **Push your code to GitHub/GitLab**.
2.  **Sign up/Log in to [Render](https://dashboard.render.com/)**.
3.  **Connect your repository**:
    *   Click **"New +"** -> **"Blueprint"**.
    *   Connect your GitHub/GitLab account and select your `extension` repository.
4.  **Configure**:
    *   Render will automatically detect the `render.yaml` file.
    *   Click **"Apply"**.
5.  **Environment Variables**:
    *   Go to the **Dashboard** -> Select your new service (`page-mind-backend`).
    *   Go to **"Environment"**.
    *   Add your secrets (Render will ask for them if they were marked as `sync: false` in the blueprint, or you can add them manually):
        *   `OPENAI_API_KEY`: `sk-...`
        *   `PINECONE_API_KEY`: `pcsk_...`
        *   `PINECONE_INDEX_NAME`: `page-mind` (if not already set)

### Option B: Manual Setup

1.  **New Web Service**:
    *   Click **"New +"** -> **"Web Service"**.
    *   Connect your repository.
2.  **Settings**:
    *   **Name**: `page-mind-backend`
    *   **Root Directory**: `backend`
    *   **Runtime**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3.  **Environment Variables**:
    *   Add `OPENAI_API_KEY`, `PINECONE_API_KEY`, and `PINECONE_INDEX_NAME` in the "Environment" tab.

### Final Step: Update Extension
Once deployed, copy your **onrender.com URL** (e.g., `https://page-mind-backend.onrender.com`).
1.  Update `extension/popup.js`: Set `backendUrl` to your Render URL.
2.  Update `extension/manifest.json`: Add your Render URL to `host_permissions`.
3.  Test locally to ensure it works.

---

## Part 2: Publish to Chrome Web Store

### 1. Prepare the Extension
1.  **Update Version**: In `extension/manifest.json`, increment the `"version"` (e.g., `"1.0.1"`).
2.  **Remove Dev Keys**: Ensure no sensitive keys are hardcoded in the client side (your extension code looks safe as it calls the backend).
3.  **Zip the Folder**:
    *   Navigate to the `extension/` directory (where `manifest.json` is).
    *   Select all files inside (`manifest.json`, `popup.html`, `popup.js`, `icons/`, etc.).
    *   Right-click -> **Compress** (or **Zip**).
    *   *Important*: Do not zip the parent folder; zip the *contents* so `manifest.json` is at the root of the zip.

### 2. Create Developer Account
1.  Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2.  Sign in with your Google Account.
3.  **Register**: There is a one-time registration fee ($5 USD).

### 3. Upload and Publish
1.  **Create New Item**: Click the **+ New Item** button.
2.  **Upload Zip**: Drag and drop your `.zip` file.
3.  **Fill Store Listing**:
    *   **Description**: Explain what your extension does clearly.
    *   **Category**: Select a relevant category (e.g., Productivity).
    *   **Language**: English.
    *   **Screenshots**: Upload at least one screenshot (1280x800 or 640x400).
    *   **Icons**: Ensure you have a 128x128 icon uploaded.
4.  **Privacy Practices**:
    *   **Host Permissions**: Justify why you need access to `https://*.amazonaws.com/*` or your Render URL (reason: "To communicate with the AI backend for summarization").
    *   **Remote Code**: Ensure you are not loading remote code (your backend API calls are fine).
    *   **Data Usage**: Disclose that you send page content to an AI backend for summarization.
5.  **Submit for Review**:
    *   Click **"Submit for Review"**.
    *   Reviews typically take 24-48 hours.

### 4. Updates
To update your extension later:
1.  Increment `version` in `manifest.json`.
2.  Zip the files again.
3.  Go to Dashboard -> Select Item -> **Package** -> **Upload new package**.
