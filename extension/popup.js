document.addEventListener('DOMContentLoaded', function() {
    const backendUrl = 'http://localhost:8000';
    let currentUrl = '';

    // UI Elements
    const pageTitleEl = document.getElementById('page-title');
    const summaryContentEl = document.getElementById('summary-content');
    const summaryErrorEl = document.getElementById('summary-error');
    const tabSummaryBtn = document.getElementById('tab-summary');
    const tabChatBtn = document.getElementById('tab-chat');
    const viewSummary = document.getElementById('view-summary');
    const viewChat = document.getElementById('view-chat');
    const startChatBtn = document.getElementById('start-chat-btn');
    const chatIntro = document.getElementById('chat-intro');
    const chatInterface = document.getElementById('chat-interface');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // Get current tab info
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs[0]) {
            currentUrl = tabs[0].url;
            pageTitleEl.textContent = tabs[0].title;
            
            // Initiate summary fetch
            fetchSummary(currentUrl);
        } else {
            pageTitleEl.textContent = "No active tab found";
            showError("Cannot access current tab.");
        }
    });

    // Tab Switching
    tabSummaryBtn.addEventListener('click', () => {
        switchTab('summary');
    });

    tabChatBtn.addEventListener('click', () => {
        switchTab('chat');
    });

    startChatBtn.addEventListener('click', () => {
        chatIntro.classList.add('hidden');
        chatInterface.classList.remove('hidden');
    });

    // Chat functionality
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function switchTab(tab) {
        if (tab === 'summary') {
            tabSummaryBtn.classList.add('active');
            tabChatBtn.classList.remove('active');
            viewSummary.classList.add('active');
            viewChat.classList.remove('active');
        } else {
            tabSummaryBtn.classList.remove('active');
            tabChatBtn.classList.add('active');
            viewSummary.classList.remove('active');
            viewChat.classList.add('active');
        }
    }

    async function fetchSummary(url) {
        try {
            const response = await fetch(`${backendUrl}/summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch summary');
            }

            const data = await response.json();
            
            // Format summary (assuming it's a string, maybe with newlines or markdown)
            // If the backend returns bullet points in a text block, we can just display it.
            // Or we can try to pretty print it.
            
            // Clear loading state
            summaryContentEl.innerHTML = '';
            
            // Simple markdown-ish to HTML or just paragraph
            // Replace newlines with <br> or wrap in <p>
            const formattedSummary = data.summary.split('\n').map(line => {
                if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                    return `<li>${line.trim().substring(1).trim()}</li>`;
                }
                return `<p>${line}</p>`;
            }).join('');

            if (formattedSummary.includes('<li>')) {
                summaryContentEl.innerHTML = `<ul>${formattedSummary}</ul>`;
            } else {
                summaryContentEl.innerHTML = formattedSummary;
            }

        } catch (error) {
            showError(`Error: ${error.message}. Make sure the backend is running.`);
        }
    }

    function showError(message) {
        summaryContentEl.classList.add('hidden');
        summaryErrorEl.textContent = message;
        summaryErrorEl.classList.remove('hidden');
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Add user message
        addMessage(text, 'user');
        chatInput.value = '';

        // Add loading message
        const loadingMsgId = addMessage('Thinking...', 'ai', true);

        try {
            const response = await fetch(`${backendUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: currentUrl,
                    question: text
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            
            // Remove loading message and add actual response
            removeMessage(loadingMsgId);
            addMessage(data.answer, 'ai');

        } catch (error) {
            removeMessage(loadingMsgId);
            addMessage(`Error: ${error.message}`, 'system');
        }
    }

    function addMessage(text, type, isLoading = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.textContent = text;
        if (isLoading) {
            msgDiv.id = 'loading-' + Date.now();
            msgDiv.style.fontStyle = 'italic';
        }
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv.id;
    }

    function removeMessage(id) {
        if (!id) return;
        const el = document.getElementById(id);
        if (el) el.remove();
    }
});
