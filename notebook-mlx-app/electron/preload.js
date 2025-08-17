const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  
  // Backend API wrapper
  api: {
    uploadSource: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:8000/api/upload-source', {
        method: 'POST',
        body: formData
      });
      return response.json();
    },
    
    chat: async (message, sourceIds) => {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, source_ids: sourceIds })
      });
      return response.json();
    },
    
    generatePodcast: async (sourceIds, options) => {
      const response = await fetch('http://localhost:8000/api/generate-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_ids: sourceIds, ...options })
      });
      return response.json();
    },
    
    generateMindMap: async (sourceIds) => {
      const response = await fetch('http://localhost:8000/api/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_ids: sourceIds })
      });
      return response.json();
    },
    
    synthesizeVoice: async (text, voiceId) => {
      const response = await fetch('http://localhost:8000/api/synthesize-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: voiceId })
      });
      return response.blob();
    },
    
    trainVoice: async (audioFiles, voiceName) => {
      const formData = new FormData();
      audioFiles.forEach(file => formData.append('audio_files', file));
      formData.append('voice_name', voiceName);
      
      const response = await fetch('http://localhost:8000/api/train-voice', {
        method: 'POST',
        body: formData
      });
      return response.json();
    }
  }
});