document.addEventListener('DOMContentLoaded', () => {
  const clipboardHistory = document.getElementById('clipboard-history');
  const searchInput = document.getElementById('search');
  const clearButton = document.getElementById('clear-history');
  const downloadButton = document.getElementById('download-txt');
  
  // Load clipboard history when popup opens
  loadClipboardHistory();
  
  // Set up search functionality
  searchInput.addEventListener('input', filterClipboardItems);
  
  // Set up clear history button
  clearButton.addEventListener('click', clearClipboardHistory);

  // Add event listener for the download button
  downloadButton.addEventListener('click', downloadClipboardAsTxt);
  
  // Function to load clipboard history from storage
  function loadClipboardHistory() {
    chrome.storage.local.get('clipboardHistory', (data) => {
      const history = data.clipboardHistory || [];
      
      if (history.length === 0) {
        // Show empty state
        clipboardHistory.innerHTML = `
          <div class="empty-state">
            <p>Your clipboard history will appear here</p>
          </div>`;
        return;
      }
      
      // Clear the clipboard history element
      clipboardHistory.innerHTML = '';
      
      // Add clipboard items to the popup
      history.forEach((item, index) => {
        const itemElement = createClipboardItemElement(item, index);
        clipboardHistory.appendChild(itemElement);
      });

      // Add event listener to each item for debugging
      clipboardHistory.querySelectorAll('.clipboard-item').forEach((item) => {
        item.addEventListener('click', () => {
          console.log(`Item clicked: ${item.dataset.index}`);
        });
      });
    });
  }
  
  // Function to create clipboard item element
  function createClipboardItemElement(item, index) {
    const clipboardItem = document.createElement('div');
    clipboardItem.className = 'clipboard-item';
    clipboardItem.dataset.index = index;
    
    // Format timestamp
    const date = new Date(item.timestamp);
    const timeString = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const dateString = date.toLocaleDateString();
    
    // Set item content
    clipboardItem.innerHTML = `
      <div class="item-content" title="${item.text}">
        ${item.text.length > 40 ? item.text.substring(0, 40) + '...' : item.text}
      </div>
      <div class="item-time">${dateString} ${timeString}</div>
      <div class="item-actions">
        <button class="copy-btn" title="Copy again">Copy</button>
      </div>
    `;
    
    // Add event listener to copy the text when clicked
    clipboardItem.querySelector('.copy-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(item.text)
        .then(() => {
          showToast('Copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          showToast('Failed to copy text');
        });
    });
    
    // Add event listener to the whole item for copying
    clipboardItem.addEventListener('click', () => {
      navigator.clipboard.writeText(item.text)
        .then(() => {
          showToast('Copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          showToast('Failed to copy text');
        });
    });
    
    return clipboardItem;
  }
  
  // Function to filter clipboard items
  function filterClipboardItems() {
    const searchTerm = searchInput.value.toLowerCase();
    const items = clipboardHistory.querySelectorAll('.clipboard-item');
    
    chrome.storage.local.get('clipboardHistory', (data) => {
      const history = data.clipboardHistory || [];
      
      items.forEach((item, index) => {
        const historyItem = history[parseInt(item.dataset.index)];
        if (historyItem && historyItem.text.toLowerCase().includes(searchTerm)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
      
      // Check if no items are visible
      const hasVisibleItems = Array.from(items).some(item => item.style.display !== 'none');
      
      if (!hasVisibleItems && history.length > 0) {
        clipboardHistory.innerHTML = `
          <div class="empty-state">
            <p>No results found for "${searchInput.value}"</p>
          </div>`;
      }
    });
  }
  
  // Function to clear clipboard history
  function clearClipboardHistory() {
    if (confirm('Are you sure you want to clear your clipboard history?')) {
      chrome.storage.local.set({ clipboardHistory: [] }, () => {
        loadClipboardHistory();
        showToast('Clipboard history cleared!');
      });
    }
  }

  // Function to download clipboard history as a .txt file
  function downloadClipboardAsTxt() {
    chrome.storage.local.get('clipboardHistory', (data) => {
      const history = data.clipboardHistory || [];
      if (history.length === 0) {
        showToast('Clipboard history is empty!');
        return;
      }

      // Create a string from the clipboard history
      const textContent = history.map(item => item.text).join('\n\n');

      // Create a blob and a download link
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clipboard_history.txt';
      a.click();

      // Revoke the object URL after download
      URL.revokeObjectURL(url);
      showToast('Clipboard history downloaded!');
    });
  }
  
  // Function to show toast message
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // Add toast styling
    toast.style.cssText = `
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #333;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 1000;
    `;
    
    document.body.appendChild(toast);
    
    // Show and hide the toast
    setTimeout(() => { toast.style.opacity = '1'; }, 10);
    setTimeout(() => { 
      toast.style.opacity = '0';
      setTimeout(() => { document.body.removeChild(toast); }, 300);
    }, 2000);
  }
});
