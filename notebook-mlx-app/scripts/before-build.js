const path = require('path');
const fs = require('fs');

module.exports = async function(context) {
  console.log('🔧 Running pre-build tasks...');
  
  const { appDir, electronVersion, arch, platform } = context;
  
  // Ensure models directory exists
  const modelsDir = path.join(appDir, 'models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
    console.log('📁 Created models directory');
  }
  
  // Ensure python-dist exists
  const pythonDistDir = path.join(appDir, 'python-dist');
  if (!fs.existsSync(pythonDistDir)) {
    console.log('⚠️  Python distribution not found. Run "npm run prepare:python" first.');
    throw new Error('Python distribution missing. Run "npm run prepare:python".');
  }
  
  console.log('✅ Pre-build tasks completed');
};