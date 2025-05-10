document.addEventListener('DOMContentLoaded', function() {
  // References to DOM elements
  const currentTabBtn = document.getElementById('currentTab');
  const customUrlBtn = document.getElementById('customUrlBtn');
  const customUrlInput = document.getElementById('customUrl');
  const qrcodeContainer = document.getElementById('qrcode');
  const downloadContainer = document.getElementById('downloadContainer');
  const downloadBtn = document.getElementById('downloadBtn');
  
  // Get current tab URL and generate QR code
  currentTabBtn.addEventListener('click', function() {
    // Show loading indicator
    showLoading();
    
    try {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs.length > 0) {
          const currentUrl = tabs[0].url;
          if (currentUrl) {
            generateQRCode(currentUrl);
          } else {
            showError('Current tab URL is empty');
          }
        } else {
          console.error('No active tab found');
          showError('Could not access the current tab URL');
        }
      });
    } catch (error) {
      console.error('Error querying tabs:', error);
      showError('Failed to access current tab: ' + error.message);
    }
  });
  
  // Generate QR code for custom URL
  customUrlBtn.addEventListener('click', function() {
    const customUrl = customUrlInput.value.trim();
    if (customUrl) {
      // Show loading indicator
      showLoading();
      
      // Add http:// prefix if not present and not a simple text string
      let url = customUrl;
      if (!/^https?:\/\//i.test(url) && url.includes('.')) {
        url = 'http://' + url;
      }
      generateQRCode(url);
    } else {
      showError('Please enter a URL or text');
    }
  });
  
  // Download QR code as image
  downloadBtn.addEventListener('click', function() {
    const qrImage = qrcodeContainer.querySelector('img');
    if (qrImage && qrImage.complete) {
      try {
        // Create a canvas to convert the image to a data URL
        const canvas = document.createElement('canvas');
        canvas.width = qrImage.width;
        canvas.height = qrImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(qrImage, 0, 0);
        
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Error downloading QR code:', error);
        showError('Failed to download QR code: ' + error.message);
      }
    }
  });
  
  // Show loading indicator
  function showLoading() {
    qrcodeContainer.innerHTML = '';
    const loader = document.createElement('div');
    loader.className = 'loader';
    qrcodeContainer.appendChild(loader);
    downloadContainer.classList.add('hidden');
  }
  
  // Show error message
  function showError(message) {
    qrcodeContainer.innerHTML = '';
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    qrcodeContainer.appendChild(errorElement);
    downloadContainer.classList.add('hidden');
  }
  
  // Generate QR code function
  function generateQRCode(url) {
    try {
      // Safety check for undefined or null values
      if (!url) {
        throw new Error('Empty or invalid input');
      }
      
      // Ensure url is a valid string
      const textToEncode = String(url || '').trim();
      
      if (textToEncode.length === 0) {
        throw new Error('Empty input after conversion');
      }
      
      // Clear container and any loading indicator
      qrcodeContainer.innerHTML = '';
      
      // Create QR code using simple image approach - no library required
      // Using the Google Chart API to generate a QR code
      const encodedText = encodeURIComponent(textToEncode);
      const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${encodedText}&chs=200x200&chld=H|0`;
      
      const qrImage = new Image();
      qrImage.alt = 'QR Code for: ' + textToEncode;
      qrImage.style.width = '200px';
      qrImage.style.height = '200px';
      
      // Set up loading and error handlers
      qrImage.onload = function() {
        // Show download button once image is loaded
        downloadContainer.classList.remove('hidden');
        console.log('QR code image loaded successfully');
      };
      
      qrImage.onerror = function() {
        // Fix: Check if the image is still a child of the container before removing
        if (qrImage.parentNode === qrcodeContainer) {
          qrcodeContainer.removeChild(qrImage);
        }
        showError('Failed to load QR code image');
      };
      
      // Add image to the container and set source to start loading
      qrcodeContainer.appendChild(qrImage);
      qrImage.src = qrImageUrl;
      
      // Log success
      console.log('Generated QR code for:', textToEncode);
    } catch (error) {
      console.error('Error generating QR code:', error);
      showError('Failed to generate QR code: ' + error.message);
    }
  }
});