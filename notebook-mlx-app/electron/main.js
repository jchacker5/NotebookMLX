const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
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
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#1a1a1a'
  });

  // Apply a restrictive Content Security Policy
  const isDev = process.env.NODE_ENV === 'development'
  const csp = (
    isDev
      ? [
          "default-src 'self' http://localhost:3000",
          "script-src 'self' 'unsafe-eval' http://localhost:3000",
          "style-src 'self' 'unsafe-inline' http://localhost:3000",
          "img-src 'self' data:",
          "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws://localhost:3000 ws://127.0.0.1:3000",
          "font-src 'self' data:",
          "media-src 'self' blob: data:",
        ]
      : [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "connect-src 'self' http://127.0.0.1:8000 http://localhost:8000",
          "font-src 'self' data:",
          "media-src 'self' blob: data:",
        ]
  ).join('; ')

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = {
      ...details.responseHeaders,
      'Content-Security-Policy': [csp],
    }
    callback({ responseHeaders })
  })

  // Load the React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startPythonBackend() {
  return new Promise((resolve, reject) => {
    let pythonCmd, pythonArgs, cwd;

    if (isDev) {
      pythonCmd = 'python3';
      pythonArgs = [path.join(__dirname, '..', 'backend', 'main.py')];
      cwd = path.join(__dirname, '..', 'backend');
    } else {
      const resourcesPath = process.resourcesPath;
      const pythonDistPath = path.join(resourcesPath, 'python-dist');
      
      if (process.platform === 'darwin') {
        pythonCmd = path.join(pythonDistPath, 'start-backend.sh');
        pythonArgs = [];
        cwd = pythonDistPath;
      } else {
        pythonCmd = path.join(pythonDistPath, 'venv', 'bin', 'python');
        pythonArgs = [path.join(pythonDistPath, 'launch.py')];
        cwd = pythonDistPath;
      }
    }
    
    console.log(`[Backend] Starting: ${pythonCmd} ${pythonArgs.join(' ')} in ${cwd}`);
    
    pythonProcess = spawn(pythonCmd, pythonArgs, {
      cwd: cwd,
      env: {
        ...process.env,
        BACKEND_DATA_DIR: app.getPath('userData'),
        PYTHONPATH: isDev ? 
          path.join(__dirname, '..', 'backend') : 
          path.join(cwd, 'backend')
      }
    });

    let backendReady = false;
    const startupTimeout = setTimeout(() => {
      if (!backendReady) {
        console.error('[Backend] Startup timeout. Killing process.');
        pythonProcess.kill();
        reject(new Error('Backend failed to start in time.'));
      }
    }, 20000); // 20 seconds

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Backend] ${output}`);
      if (output.includes('Uvicorn running on')) {
        backendReady = true;
        clearTimeout(startupTimeout);
        console.log('[Backend] Successfully started!');
        resolve(true);
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const errorMsg = data.toString();
      console.error(`[Backend] Error: ${errorMsg}`);
      // Reject only on critical startup errors, not all stderr output
      if (!backendReady && errorMsg.toLowerCase().includes('error')) {
        clearTimeout(startupTimeout);
        reject(new Error(`Backend failed to start: ${errorMsg}`));
      }
    });

    pythonProcess.on('close', (code) => {
      console.log(`[Backend] Exited with code ${code}`);
      if (!backendReady) {
        clearTimeout(startupTimeout);
        reject(new Error(`Backend process exited prematurely with code ${code}`))}
    });
    
    pythonProcess.on('error', (error) => {
      console.error(`[Backend] Failed to start process: ${error}`);
      clearTimeout(startupTimeout);
      reject(error);
    });
  });
}

app.whenReady().then(async () => {
  try {
    await startPythonBackend();
    createWindow();
  } catch (error) {
    console.error('App startup error:', error);
    dialog.showErrorBox(
      'Application Error',
      `Failed to start the backend. Please check logs for details.\n\nError: ${error.message}`
    );
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (pythonProcess) {
    console.log('[Backend] Killing backend process...');
    pythonProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
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

// Minimal API proxy with basic validation (optional)
ipcMain.handle('api:request', async (event, payload) => {
  try {
    const { path, method = 'GET', body } = payload || {}
    if (typeof path !== 'string' || !/^\/api\//.test(path)) {
      throw new Error('Invalid API path')
    }
    const allowed = ['GET', 'POST']
    const methodUpper = String(method).toUpperCase()
    if (!allowed.includes(methodUpper)) {
      throw new Error('Invalid method')
    }
    // Whitelist endpoints with method restrictions
    const allow = [
      { re: /^\/api\/upload-source$/, methods: ['POST'] },
      { re: /^\/api\/chat$/, methods: ['POST'] },
      { re: /^\/api\/generate-podcast$/, methods: ['POST'] },
      { re: /^\/api\/task\//, methods: ['GET'] },
      { re: /^\/api\/generate-mindmap$/, methods: ['POST'] },
      { re: /^\/api\/synthesize-voice$/, methods: ['POST'] },
      { re: /^\/api\/train-voice$/, methods: ['POST'] },
      { re: /^\/api\/download\//, methods: ['GET'] },
      { re: /^\/api\/upload-chunk$/, methods: ['POST'] },
      { re: /^\/api\/merge-chunks$/, methods: ['POST'] },
      { re: /^\/api\/export\//, methods: ['GET', 'POST'] },
    ]
    const matched = allow.find((x) => x.re.test(path))
    if (!matched || !matched.methods.includes(methodUpper)) {
      throw new Error('Path not permitted')
    }
    const res = await fetch(`http://localhost:8000${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      return await res.json()
    }
    const buf = await res.arrayBuffer()
    return { status: res.status, body: Buffer.from(buf).toString('base64') }
  } catch (e) {
    return { error: String(e) }
  }
})
