// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "copy-enhanced") {
    try {
      // Copy with formatting
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        showNotification("No text selected!");
        return;
      }
      
      const range = selection.getRangeAt(0);
      const div = document.createElement('div');
      div.appendChild(range.cloneContents());
      
      // Get both plain text and HTML
      const text = selection.toString();
      const html = div.innerHTML;
      
      // Use clipboard API to copy HTML
      navigator.clipboard.writeText(text)
        .then(() => {
          // Add to clipboard history
          chrome.runtime.sendMessage({
            action: "addToHistory",
            text: text,
            html: html
          });
          
          // Show success notification
          showNotification("Copied with formatting!");
        })
        .catch(err => {
          console.error("Failed to copy:", err);
          showNotification("Failed to copy text. Please try again.");
        });
    } catch (err) {
      console.error("Error in copy-enhanced:", err);
      showNotification("Error occurred during copy operation.");
    }
  } 
  else if (message.action === "copy-plain") {
    try {
      // Copy as plain text only
      const text = message.text;
      if (!text) {
        showNotification("No text to copy!");
        return;
      }
      
      navigator.clipboard.writeText(text)
        .then(() => {
          // Add to clipboard history
          chrome.runtime.sendMessage({
            action: "addToHistory",
            text: text,
            html: text
          });
          
          // Show success notification
          showNotification("Copied as plain text!");
        })
        .catch(err => {
          console.error("Failed to copy:", err);
          showNotification("Failed to copy text. Please try again.");
        });
    } catch (err) {
      console.error("Error in copy-plain:", err);
      showNotification("Error occurred during copy operation.");
    }
  }
  else if (message.action === "paste") {
    try {
      // Handle paste operation using Clipboard API
      const activeElement = document.activeElement;
      if (!activeElement) {
        showNotification("No active element to paste into!");
        return;
      }

      if (activeElement.isContentEditable || 
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA') {

        // Use Clipboard API to paste text
        navigator.clipboard.writeText(message.text)
          .then(() => {
            if (activeElement.isContentEditable) {
              // Modern approach for inserting HTML content
              const range = window.getSelection().getRangeAt(0);
              range.deleteContents();
              const fragment = range.createContextualFragment(message.html || message.text);
              range.insertNode(fragment);
            } else {
              activeElement.value += message.text;
            }
            showNotification("Pasted from history!");
          })
          .catch(err => {
            console.error("Failed to paste:", err);
            showNotification("Failed to paste text. Please try again.");
          });
      } else {
        showNotification("Cannot paste here. Not an editable area.");
      }
    } catch (err) {
      console.error("Error in paste:", err);
      showNotification("Error occurred during paste operation.");
    }
  }
});

// Function to show a notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'copy-paste-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 99999;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    animation: fadeIn 0.3s, fadeOut 0.3s 1.7s;
    opacity: 0;
  `;
  
  document.body.appendChild(notification);
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(20px); }
    }
  `;
  document.head.appendChild(style);
  
  // Trigger animation
  setTimeout(() => notification.style.opacity = '1', 10);
  
  // Remove notification after 2 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
    if (document.head.contains(style)) {
      document.head.removeChild(style);
    }
  }, 2000);
}
