document.addEventListener('DOMContentLoaded', function() {
  // Check if we need to generate icons
  chrome.storage.local.get(['iconsGenerated'], function(result) {
    if (!result.iconsGenerated) {
      generateIcons();
    }
  });

  function generateIcons() {
    const sizes = [16, 48, 128];
    let iconPromises = [];

    sizes.forEach(size => {
      iconPromises.push(createIcon(size));
    });

    Promise.all(iconPromises).then(() => {
      chrome.storage.local.set({iconsGenerated: true}, function() {
        console.log('Icons have been generated successfully');
      });
    });
  }

  function createIcon(size) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = '#4285f4';
      ctx.fillRect(0, 0, size, size);
      
      // QR code-like pattern
      ctx.fillStyle = '#ffffff';
      const margin = Math.round(size * 0.125);
      const innerSize = size - (margin * 2);
      ctx.fillRect(margin, margin, innerSize, innerSize);
      
      // Draw QR-like squares
      ctx.fillStyle = '#4285f4';
      const blockSize = Math.round(innerSize * 0.2);
      
      // Corner squares
      const offset = margin + Math.round(innerSize * 0.1);
      ctx.fillRect(offset, offset, blockSize, blockSize);
      ctx.fillRect(size - offset - blockSize, offset, blockSize, blockSize);
      ctx.fillRect(offset, size - offset - blockSize, blockSize, blockSize);
      
      // Center pattern
      const centerOffset = size/2 - blockSize/2;
      ctx.fillRect(centerOffset, centerOffset, blockSize, blockSize);
      
      // Add some dots
      const dotSize = Math.max(1, Math.round(size * 0.05));
      ctx.fillRect(offset + blockSize/2, size/2, dotSize, dotSize);
      ctx.fillRect(size/2, offset + blockSize/2, dotSize, dotSize);
      ctx.fillRect(size - offset - blockSize/2, size/2, dotSize, dotSize);
      ctx.fillRect(size/2, size - offset - blockSize/2, dotSize, dotSize);
      
      // Convert to blob and store as a PNG file
      canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        // In a real extension, you would save this blob to a file
        // but for our purpose, we'll just store the URL
        chrome.storage.local.set({[`icon${size}`]: url}, function() {
          console.log(`Icon ${size}x${size} generated`);
          resolve();
        });
      }, 'image/png');
    });
  }
});