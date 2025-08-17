const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a1a'
  });

  // Load the React app
  mainWindow.loadURL(
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../frontend/dist/index.html')}`
  );

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startPythonBackend() {
  const isDev = process.env.NODE_ENV === 'development';
  let pythonCmd, pythonArgs, cwd;
  
  if (isDev) {
    // Development mode - use local Python
    pythonCmd = 'python';
    pythonArgs = [path.join(__dirname, '..', 'backend', 'main.py')];
    cwd = path.join(__dirname, '..', 'backend');
  } else {
    // Production mode - use bundled Python
    const resourcesPath = process.resourcesPath || path.join(__dirname, '..');
    const pythonDistPath = path.join(resourcesPath, 'python-dist');
    
    if (process.platform === 'darwin') {
      // macOS
      pythonCmd = path.join(pythonDistPath, 'start-backend.sh');
      pythonArgs = [];
      cwd = pythonDistPath;
    } else {
      // Windows/Linux
      pythonCmd = path.join(pythonDistPath, 'venv', 'bin', 'python');
      pythonArgs = [path.join(pythonDistPath, 'launch.py')];
      cwd = pythonDistPath;
    }
  }
  
  console.log(`Starting Python backend: ${pythonCmd} ${pythonArgs.join(' ')}`);
  
  pythonProcess = spawn(pythonCmd, pythonArgs, {
    cwd: cwd,
    env: {
      ...process.env,
      PYTHONPATH: isDev ? 
        path.join(__dirname, '..', 'backend') : 
        path.join(cwd, 'backend')
    }
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python Backend: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Backend Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python Backend exited with code ${code}`);
  });
  
  pythonProcess.on('error', (error) => {
    console.error(`Failed to start Python backend: ${error}`);
  });
}

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for file operations
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['pdf', 'txt', 'md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});