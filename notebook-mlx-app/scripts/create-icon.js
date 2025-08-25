const fs = require('fs');
const path = require('path');

// This script creates a simple SVG icon that can be converted to .icns
// In production, you'd want to use a proper icon design tool

const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#grad1)" />
  
  <!-- Microphone icon -->
  <rect x="230" y="180" width="52" height="80" rx="26" fill="white" />
  <rect x="240" y="280" width="32" height="60" fill="white" />
  <rect x="220" y="330" width="72" height="20" rx="10" fill="white" />
  
  <!-- Sound waves -->
  <path d="M 300 220 Q 320 240 300 260" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" />
  <path d="M 320 200 Q 350 240 320 280" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" />
  <path d="M 340 180 Q 380 240 340 300" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" />
  
  <!-- Document pages behind -->
  <rect x="150" y="140" width="80" height="100" fill="white" opacity="0.3" rx="5" />
  <rect x="160" y="130" width="80" height="100" fill="white" opacity="0.5" rx="5" />
  <rect x="170" y="120" width="80" height="100" fill="white" opacity="0.7" rx="5" />
  
  <!-- Text "MLX" -->
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">MLX</text>
</svg>`;

const assetsDir = path.join(__dirname, '..', 'assets');
const iconPath = path.join(assetsDir, 'icon.svg');

fs.writeFileSync(iconPath, iconSvg);
console.log('✅ Icon SVG created at:', iconPath);
console.log('📝 To create .icns file for macOS:');
console.log('   1. Open icon.svg in any graphics editor');
console.log('   2. Export as PNG at 512x512, 256x256, 128x128, 64x64, 32x32, 16x16');
console.log('   3. Use iconutil: iconutil -c icns icon.iconset');
console.log('   4. Or use online converter: https://convertio.co/svg-icns/');