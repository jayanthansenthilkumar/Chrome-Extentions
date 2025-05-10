// Background script for QR Code Generator extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('QR Code Generator Extension installed');
  
  // Pre-generate static PNG icons from SVG to ensure they're available
  // This is a fallback approach since we're generating icons dynamically in popup
  generateStaticIcons();
});

// Listen for messages from popup.js or icon_generator.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabUrl') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0].url });
    });
    return true; // Required for async response
  }
  
  if (request.action === 'iconGenerated') {
    console.log('Icon generated notification received');
    sendResponse({ success: true });
    return true;
  }
});

// Function to generate static versions of our icon PNGs
function generateStaticIcons() {
  // In a real production extension, this function would create actual PNG files
  // For this educational example, we'll just log the generation attempt
  console.log('Attempting to generate static fallback icons');
  
  // Store a flag to indicate we've attempted icon generation
  chrome.storage.local.set({ iconGenerationAttempted: true });
}