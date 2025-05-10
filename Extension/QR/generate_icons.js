// This file will generate simple placeholder icons in the popup
// You should replace these with proper icons for your extension

document.addEventListener('DOMContentLoaded', function() {
  function createPlaceholderIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#4285f4';
    ctx.fillRect(0, 0, 128, 128);
    
    // QR code-like pattern
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 20, 88, 88);
    
    // Draw QR-like squares
    ctx.fillStyle = '#4285f4';
    // Corner squares
    ctx.fillRect(30, 30, 20, 20);
    ctx.fillRect(78, 30, 20, 20);
    ctx.fillRect(30, 78, 20, 20);
    // Center pattern
    ctx.fillRect(54, 54, 20, 20);
    
    // Add some dots
    ctx.fillRect(40, 60, 8, 8);
    ctx.fillRect(60, 40, 8, 8);
    ctx.fillRect(80, 60, 8, 8);
    ctx.fillRect(60, 80, 8, 8);
    
    return canvas;
  }
  
  // Create icon for development purposes
  const iconContainer = document.createElement('div');
  iconContainer.style.display = 'none';
  iconContainer.id = 'iconContainer';
  document.body.appendChild(iconContainer);
  
  const icon = createPlaceholderIcon();
  iconContainer.appendChild(icon);
  
  // This would normally be used to save the icons, but we'll just log a message
  console.log('Placeholder icon created. In a real environment, you would save these as PNG files.');
});