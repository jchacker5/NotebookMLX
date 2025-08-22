const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🐍 Preparing Python distribution for bundling...');

const rootDir = path.join(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const pythonDistDir = path.join(rootDir, 'python-dist');

// Clean previous dist
if (fs.existsSync(pythonDistDir)) {
  fs.rmSync(pythonDistDir, { recursive: true, force: true });
}
fs.mkdirSync(pythonDistDir, { recursive: true });

try {
  // Create virtual environment
  console.log('Creating virtual environment...');
  execSync('python3 -m venv python-dist/venv', { cwd: rootDir, stdio: 'inherit' });
  
  // Install dependencies
  console.log('Installing Python dependencies...');
  const venvPython = path.join(pythonDistDir, 'venv', 'bin', 'python');
  const pipPath = path.join(pythonDistDir, 'venv', 'bin', 'pip');
  
  execSync(`${pipPath} install --upgrade pip --quiet`, { stdio: 'inherit' });
  // Install with optimizations: no cache to reduce size, compile bytecode
  execSync(`${pipPath} install --no-cache-dir --compile -r backend/requirements.txt`, { cwd: rootDir, stdio: 'inherit' });
  
  // Copy backend code
  console.log('Copying backend code...');
  const backendDistDir = path.join(pythonDistDir, 'backend');
  fs.mkdirSync(backendDistDir, { recursive: true });
  
  // Copy Python files (excluding venv, __pycache__, etc.)
  const copyRecursive = (src, dest) => {
    const items = fs.readdirSync(src);
    for (const item of items) {
      if (item === 'venv' || item === '__pycache__' || item === '.env' || 
          item === '.git' || item === 'node_modules' || item === '.pytest_cache' ||
          item === 'data' || item === 'models' || item === 'tests' ||
          item.startsWith('.') || item.endsWith('.pyc')) continue;
      
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyRecursive(backendDir, backendDistDir);
  
  // Create launcher script
  const launcherScript = `#!/bin/bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
export PYTHONPATH="$DIR/backend:$PYTHONPATH"
"$DIR/venv/bin/python" "$DIR/backend/main.py" "$@"
`;
  
  const launcherPath = path.join(pythonDistDir, 'start-backend.sh');
  fs.writeFileSync(launcherPath, launcherScript);
  fs.chmodSync(launcherPath, '755');
  
  // Create Python launcher for Windows/cross-platform
  const pythonLauncher = `import sys
import os
import subprocess

# Add backend to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

# Set up environment
os.environ['PYTHONPATH'] = backend_dir + os.pathsep + os.environ.get('PYTHONPATH', '')

# Launch backend
python_exe = os.path.join(os.path.dirname(__file__), 'venv', 'bin', 'python')
if not os.path.exists(python_exe):
    python_exe = os.path.join(os.path.dirname(__file__), 'venv', 'Scripts', 'python.exe')

main_py = os.path.join(backend_dir, 'main.py')
subprocess.run([python_exe, main_py] + sys.argv[1:])
`;
  
  fs.writeFileSync(path.join(pythonDistDir, 'launch.py'), pythonLauncher);
  
  console.log('✅ Python distribution prepared successfully!');
  console.log(`📁 Distribution located at: ${pythonDistDir}`);
  
} catch (error) {
  console.error('❌ Error preparing Python distribution:', error.message);
  process.exit(1);
}