// Initialize clipboard history
chrome.runtime.onInstalled.addListener(() => {
  try {
    // Create context menu items
    chrome.contextMenus.create({
      id: "copy-enhanced",
      title: "Enhanced Copy",
      contexts: ["selection"]
    });
    
    chrome.contextMenus.create({
      id: "copy-plain",
      title: "Copy as Plain Text",
      contexts: ["selection"]
    });
    
    chrome.contextMenus.create({
      id: "paste-last",
      title: "Paste Last Copied",
      contexts: ["editable"]
    });
    
    // Initialize empty clipboard history
    chrome.storage.local.set({ clipboardHistory: [] });
    console.log("Enhanced Copy Paste extension initialized successfully");
  } catch (err) {
    console.error("Error initializing Enhanced Copy Paste extension:", err);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  try {
    if (!tab || !tab.id) {
      console.error("Invalid tab information");
      return;
    }
    
    if (info.menuItemId === "copy-enhanced" || info.menuItemId === "copy-plain") {
      if (!info.selectionText) {
        console.log("No text selected for copying");
        return;
      }

      // Check if the tab is in a valid state before sending the message
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => true // Dummy function to ensure content script is injected
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error("Error injecting content script:", chrome.runtime.lastError);
          return;
        }

        // Send message to content script to handle the copy
        chrome.tabs.sendMessage(tab.id, {
          action: info.menuItemId,
          text: info.selectionText
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message to content script:", chrome.runtime.lastError);
          } else if (response && response.error) {
            console.error("Content script error:", response.error);
          }
        });
      });
    } else if (info.menuItemId === "paste-last") {
      // Check if the tab is in a valid state before sending the message
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => true // Dummy function to ensure content script is injected
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error("Error injecting content script:", chrome.runtime.lastError);
          return;
        }

        // Send message to content script to handle the paste
        chrome.storage.local.get("clipboardHistory", (data) => {
          const history = data.clipboardHistory || [];
          if (history.length > 0) {
            chrome.tabs.sendMessage(tab.id, {
              action: "paste",
              text: history[0].text,
              html: history[0].html
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error sending message to content script:", chrome.runtime.lastError);
                // Retry sending the message after ensuring the content script is injected
                chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ["content/content.js"]
                }, () => {
                  if (chrome.runtime.lastError) {
                    console.error("Failed to inject content script on retry:", chrome.runtime.lastError);
                  } else {
                    chrome.tabs.sendMessage(tab.id, {
                      action: "paste",
                      text: history[0].text,
                      html: history[0].html
                    }, (retryResponse) => {
                      if (chrome.runtime.lastError) {
                        console.error("Retry failed to send message to content script:", chrome.runtime.lastError);
                      } else if (retryResponse && retryResponse.error) {
                        console.error("Content script error on retry:", retryResponse.error);
                      }
                    });
                  }
                });
              } else if (response && response.error) {
                console.error("Content script error:", response.error);
              }
            });
          } else {
            console.log("Clipboard history is empty, nothing to paste");
          }
        });
      });
    }
  } catch (err) {
    console.error("Error handling context menu click:", err);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === "addToHistory") {
      if (!message.text) {
        console.log("No text content to add to history");
        return;
      }
      
      chrome.storage.local.get("clipboardHistory", (data) => {
        let history = data.clipboardHistory || [];
        
        // Add new item to the beginning of the array
        history.unshift({
          text: message.text,
          html: message.html || message.text,
          timestamp: new Date().getTime()
        });
        
        // Limit history to 20 items
        if (history.length > 20) {
          history = history.slice(0, 20);
        }
        
        chrome.storage.local.set({ clipboardHistory: history });
        console.log("Added item to clipboard history");
      });
    }
  } catch (err) {
    console.error("Error handling message from content script:", err);
  }
});
