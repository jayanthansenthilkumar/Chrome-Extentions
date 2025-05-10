document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const urlInput = document.getElementById('urlInput');
  const shortenButton = document.getElementById('shortenButton');
  const resultContainer = document.getElementById('resultContainer');
  const shortUrl = document.getElementById('shortUrl');
  const copyButton = document.getElementById('copyButton');
  const errorElement = document.getElementById('error');
  const historyContainer = document.getElementById('historyContainer');

  // Load history from storage
  loadHistory();

  // Event listeners
  shortenButton.addEventListener('click', shortenUrl);
  copyButton.addEventListener('click', copyToClipboard);
  urlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      shortenUrl();
    }
  });

  // Function to shorten URL
  async function shortenUrl() {
    const longUrl = urlInput.value.trim();
    errorElement.textContent = '';
    
    if (!longUrl) {
      showError('Please enter a URL');
      return;
    }

    // Enhanced URL validation
    if (!isValidUrl(longUrl)) {
      showError('Please enter a valid URL with http:// or https://');
      return;
    }

    try {
      shortenButton.textContent = 'Shortening...';
      shortenButton.disabled = true;
      
      // Using the TinyURL API to shorten the URL
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      
      if (!response.ok) {
        throw new Error('Failed to shorten URL');
      }
      
      const shortened = await response.text();
      
      // Display the shortened URL
      shortUrl.value = shortened;
      resultContainer.style.display = 'flex';
      
      // Save to history
      saveToHistory(longUrl, shortened);
      
      shortenButton.textContent = 'Shorten';
      shortenButton.disabled = false;
    } catch (error) {
      showError('Error: ' + error.message);
      shortenButton.textContent = 'Shorten';
      shortenButton.disabled = false;
    }
  }

  // Function to copy shortened URL to clipboard
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shortUrl.value);
      
      // Visual feedback
      const originalText = copyButton.textContent;
      copyButton.textContent = 'Copied!';
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 1500);
    } catch (error) {
      showError('Failed to copy: ' + error.message);
    }
  }

  // Enhanced function to validate URL
  function isValidUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (error) {
      // Try adding https:// if the user entered a URL without protocol
      try {
        const urlWithProtocol = new URL('https://' + url);
        urlInput.value = urlWithProtocol.href; // Update input with protocol
        return true;
      } catch (innerError) {
        return false;
      }
    }
  }

  // Function to show error message
  function showError(message) {
    errorElement.textContent = message;
  }

  // Function to escape HTML to prevent XSS
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Function to save URL to history
  function saveToHistory(longUrl, shortUrl) {
    chrome.storage.local.get(['urlHistory'], function(result) {
      const history = result.urlHistory || [];
      
      // Check if this URL is already in history
      const existingIndex = history.findIndex(item => item.long === longUrl);
      
      if (existingIndex !== -1) {
        // Remove the existing entry
        history.splice(existingIndex, 1);
      }
      
      // Add new entry at the beginning
      history.unshift({
        long: longUrl,
        short: shortUrl,
        date: new Date().toISOString()
      });
      
      // Keep only the latest 10 entries
      const updatedHistory = history.slice(0, 10);
      
      chrome.storage.local.set({urlHistory: updatedHistory}, function() {
        loadHistory();
      }, function(error) {
        if (chrome.runtime.lastError) {
          showError('Storage error: ' + chrome.runtime.lastError.message);
        }
      });
    }, function(error) {
      if (chrome.runtime.lastError) {
        showError('Storage error: ' + chrome.runtime.lastError.message);
      }
    });
  }

  // Function to load history from storage
  function loadHistory() {
    chrome.storage.local.get(['urlHistory'], function(result) {
      const history = result.urlHistory || [];
      historyContainer.innerHTML = '';
      
      if (history.length === 0) {
        historyContainer.innerHTML = '<p>No history yet</p>';
        return;
      }
      
      history.forEach(function(item) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const formattedDate = new Date(item.date).toLocaleDateString();
        
        // Using escaped HTML for safety
        historyItem.innerHTML = `
          <div class="history-url" title="${escapeHtml(item.long)}">
            ${escapeHtml(item.short)}
            <small>(${formattedDate})</small>
          </div>
          <div class="history-actions">
            <button class="copy-history-btn">Copy</button>
            <button class="delete-btn">Delete</button>
          </div>
        `;
        
        historyContainer.appendChild(historyItem);
        
        // Add click event for copy button
        historyItem.querySelector('.copy-history-btn').addEventListener('click', async function() {
          try {
            await navigator.clipboard.writeText(item.short);
            
            // Visual feedback
            this.textContent = 'Copied!';
            setTimeout(() => {
              this.textContent = 'Copy';
            }, 1500);
          } catch (error) {
            // Fallback method if Clipboard API fails
            const textArea = document.createElement('textarea');
            textArea.value = item.short;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // Visual feedback
            this.textContent = 'Copied!';
            setTimeout(() => {
              this.textContent = 'Copy';
            }, 1500);
          }
        });
        
        // Add click event for delete button
        historyItem.querySelector('.delete-btn').addEventListener('click', function() {
          deleteHistoryItem(item.date);
        });
      });
    }, function(error) {
      if (chrome.runtime.lastError) {
        showError('Error loading history: ' + chrome.runtime.lastError.message);
      }
    });
  }

  // Function to delete history item
  function deleteHistoryItem(itemDate) {
    chrome.storage.local.get(['urlHistory'], function(result) {
      const history = result.urlHistory || [];
      const updatedHistory = history.filter(item => item.date !== itemDate);
      
      chrome.storage.local.set({urlHistory: updatedHistory}, function() {
        loadHistory();
      }, function(error) {
        if (chrome.runtime.lastError) {
          showError('Storage error: ' + chrome.runtime.lastError.message);
        }
      });
    }, function(error) {
      if (chrome.runtime.lastError) {
        showError('Error loading history: ' + chrome.runtime.lastError.message);
      }
    });
  }
});