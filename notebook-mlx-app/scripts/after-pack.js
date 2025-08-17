const path = require('path');
const fs = require('fs');

module.exports = async function(context) {
  console.log('🔧 Running post-pack tasks...');
  
  const { appOutDir, packager, electronPlatformName } = context;
  
  if (electronPlatformName === 'darwin') {
    // Make sure Python scripts are executable on macOS
    const appPath = path.join(appOutDir, 'NotebookMLX.app');
    const resourcesPath = path.join(appPath, 'Contents', 'Resources');
    const pythonDistPath = path.join(resourcesPath, 'python-dist');
    
    if (fs.existsSync(pythonDistPath)) {
      // Make shell scripts executable
      const startScript = path.join(pythonDistPath, 'start-backend.sh');
      if (fs.existsSync(startScript)) {
        fs.chmodSync(startScript, '755');
        console.log('✅ Made start-backend.sh executable');
      }
      
      // Make Python executable (try-catch for permission issues)
      const pythonBin = path.join(pythonDistPath, 'venv', 'bin', 'python');
      if (fs.existsSync(pythonBin)) {
        try {
          fs.chmodSync(pythonBin, '755');
          console.log('✅ Made Python executable');
        } catch (error) {
          console.log('⚠️  Could not change Python permissions, but app should still work');
        }
      }
    }
  }
  
  console.log('✅ Post-pack tasks completed');
};