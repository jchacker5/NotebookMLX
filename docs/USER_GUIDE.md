# NotebookMLX User Guide

Welcome to NotebookMLX! This comprehensive guide will help you get started with converting PDFs into engaging conversational podcasts using Apple's MLX framework.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding the Interface](#understanding-the-interface)
3. [Working with Sources](#working-with-sources)
4. [Chat Interactions](#chat-interactions)
5. [Studio Features](#studio-features)
6. [Exporting Content](#exporting-content)
7. [Troubleshooting](#troubleshooting)
8. [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

### First Launch

When you first open NotebookMLX, you'll see the main interface with three primary areas:

1. **Sources Panel** (left) - Manage your PDF documents
2. **Chat Panel** (center) - Interact with your documents
3. **Studio Panel** (center, alternative view) - Create podcasts and mind maps

### Quick Start Tutorial

**Step 1: Upload Your First Document**
1. Click the "Add Source" button in the Sources panel
2. Select a PDF file from your computer (max 200MB)
3. Wait for the document to be processed (this may take a few minutes)
4. The document will appear in your Sources panel with a "Completed" status

**Step 2: Start a Conversation**
1. Select your uploaded document by checking the box next to it
2. Type a question in the chat input at the bottom
3. Press Enter or click Send
4. NotebookMLX will analyze your document and provide a response with citations

**Step 3: Generate Your First Podcast**
1. Switch to the Studio panel by clicking the "Studio" tab
2. Ensure your document is selected
3. Choose voices for Speaker 1 and Speaker 2
4. Click "Generate Podcast"
5. Wait for the generation process to complete
6. Listen to your generated podcast!

## Understanding the Interface

### Main Navigation

The application uses a tab-based interface:

- **Chat Tab**: Interactive Q&A with your documents
- **Studio Tab**: Content creation tools (podcasts, mind maps, videos)

### Sources Panel Features

- **File Upload**: Drag and drop or click to upload PDFs
- **Source Selection**: Check boxes to select documents for chat/generation
- **Status Indicators**: 
  - 🟡 Processing - Document is being analyzed
  - 🟢 Completed - Ready for use
  - 🔴 Error - Processing failed
- **Search**: Filter sources by filename
- **Refresh**: Update source status

### Status Indicators

Throughout the interface, you'll see various status indicators:

- **Loading spinners**: Operations in progress
- **Progress bars**: Show completion percentage for long tasks
- **Color-coded badges**: Quick status identification
- **Toast notifications**: Success/error messages

## Working with Sources

### Supported File Types

NotebookMLX currently supports:
- **PDF documents** (.pdf)
- **Plain text files** (.txt)

### File Size Limits

- **Standard upload**: Up to 200MB per file
- **Large files**: Automatically use chunked upload for files ≥8MB
- **Total content**: Up to 100,000 characters extracted per document

### Document Processing

When you upload a document, NotebookMLX:

1. **Extracts text** from your PDF using advanced parsing
2. **Chunks content** into manageable sections (1000 words each)
3. **Cleans and preprocesses** text using Qwen2.5-1.5B model
4. **Indexes content** for fast retrieval during chat and generation

### Managing Sources

**Selecting Sources:**
- Check individual sources for targeted analysis
- Use "Select All" to include all completed sources
- Selected sources appear highlighted in blue

**Removing Sources:**
- Click the trash icon next to any source
- Confirm deletion in the popup dialog
- This permanently removes the source and its processed data

**Refreshing Sources:**
- Click the refresh icon to update source statuses
- Useful if processing seems stuck or to check for updates

## Chat Interactions

### Starting a Conversation

1. **Select Sources**: Choose one or more processed documents
2. **Ask Questions**: Type natural language questions about your content
3. **Review Responses**: Get detailed answers with source citations
4. **Follow Up**: Continue the conversation with related questions

### Types of Questions You Can Ask

**Summarization:**
- "What are the main findings in this research paper?"
- "Summarize the key points of this document"
- "What are the conclusions?"

**Analysis:**
- "Compare the methodologies discussed"
- "What are the strengths and weaknesses mentioned?"
- "How do these results relate to previous research?"

**Specific Information:**
- "What does the paper say about machine learning applications?"
- "Find information about data collection methods"
- "What are the limitations mentioned?"

**Creative Interpretation:**
- "Explain this concept as if I'm a beginner"
- "What are the practical implications?"
- "How could this be applied in industry?"

### Understanding Citations

Each response includes citations that show:
- **Source Document**: Which PDF the information came from
- **Relevance Score**: How closely the source matches your question (0-100%)
- **Clickable Links**: Click citations to see the source context

### Chat Management

**Clearing Chat History:**
- Click the "Clear Chat" button to start fresh
- This only clears the conversation, not your sources

**Exporting Conversations:**
- Use the Export button to save chat history
- Available formats: PDF, HTML, Markdown, JSON

## Studio Features

The Studio is where you create engaging content from your documents.

### Podcast Generation

**Basic Podcast Creation:**

1. **Select Sources**: Choose the documents you want to discuss
2. **Configure Speakers**:
   - Speaker 1: Usually the "teacher" or expert
   - Speaker 2: The "curious learner" asking questions
3. **Choose Voices**: Select from built-in or custom trained voices
4. **Generation Options**:
   - Enable "Dramatic Enhancement" for more engaging conversation
   - Set target duration (optional)
   - Choose conversation style

**Voice Options:**

- **Built-in Voices**: 
  - Default Male/Female voices
  - Multiple language options
  - Ready to use immediately

- **Custom Voices**: 
  - Train your own voices with audio samples
  - Minimum 2-3 minutes of clear audio needed
  - Process takes 5-15 minutes depending on quality settings

**Podcast Generation Process:**

1. **Transcript Generation** (2-5 minutes): Creates conversation script
2. **Dramatic Enhancement** (1-3 minutes): Makes dialogue more engaging
3. **Audio Synthesis** (5-15 minutes): Converts text to speech
4. **Final Assembly** (1-2 minutes): Combines all audio segments

### Mind Map Creation

**Generating Mind Maps:**

1. Select your source documents
2. Click "Generate Mind Map" in the Mind Map Studio
3. Wait for processing (1-3 minutes)
4. Interact with the generated visualization

**Mind Map Features:**

- **Interactive Nodes**: Click to explore topics
- **Hierarchical Structure**: Central topic with branching subtopics
- **Source Linking**: See which documents contributed to each node
- **Export Options**: Save as image or interactive HTML

### Video Generation

**Creating Videos from Podcasts:**

1. First generate a podcast (see above)
2. Switch to Video Studio
3. Select your completed podcast
4. Choose video template:
   - **Simple**: Static background with title
   - **Waveform**: Animated audio visualization
   - **Transcript**: Synchronized text display

**Video Customization:**

- Background colors/images
- Text overlay options
- Font and styling choices
- Transition effects

### Voice Training

**Training Custom Voices:**

1. Go to Voice Studio
2. Click "Train New Voice"
3. Upload 3-10 audio files (WAV format recommended)
4. Provide voice name and description
5. Choose quality setting:
   - **Fast**: 2-5 minutes, good quality
   - **Balanced**: 5-10 minutes, better quality
   - **High**: 10-20 minutes, best quality

**Audio Requirements for Training:**
- Clear speech without background noise
- Multiple sentences/phrases
- Consistent speaking pace and tone
- Total duration: 2-10 minutes of audio

## Exporting Content

### Export Modal Overview

The Export Modal provides unified access to all export options:

1. Click any "Export" button in the interface
2. Choose your content type (Chat, Podcast, etc.)
3. Select export format
4. Configure options
5. Download your file

### Chat Exports

**PDF Export:**
- Professional document format
- Includes conversation history
- Optional cover image
- Formatted for printing

**HTML Export:**
- Interactive web page
- Clickable citations
- Responsive design
- Easy sharing

**Markdown Export:**
- Plain text format
- Great for documentation
- Version control friendly
- Cross-platform compatible

**JSON Export:**
- Raw data format
- For developers/integration
- Includes all metadata
- Programmatic access

### Podcast Exports

**ZIP Package:**
- Complete podcast bundle
- Audio files (WAV format)
- Transcript with timestamps
- Metadata and configuration
- Cover image (if available)

**Segments JSON:**
- Developer-friendly format
- Per-segment timing data
- Speaker assignments
- Audio file references

**Audio Download:**
- Direct MP3/WAV download
- Combined final audio
- Ready for distribution

### Advanced Export Options

**Customization:**
- Include/exclude timestamps
- Show/hide citations
- Custom filenames
- Cover image upload

**Batch Operations:**
- Export multiple chats at once
- Bulk podcast downloads
- Archive entire sessions

## Troubleshooting

### Common Issues and Solutions

**PDF Processing Fails:**
- Ensure PDF is not password-protected
- Check file size (max 200MB)
- Try with a different PDF to isolate the issue
- Verify PDF contains extractable text (not just images)

**Chat Responses Are Poor:**
- Make sure sources are selected (blue highlighting)
- Use more specific questions
- Try rephrasing your question
- Ensure document processing completed successfully

**Podcast Generation Stuck:**
- Check system resources (CPU/memory usage)
- Verify selected sources are valid
- Try with fewer or smaller documents
- Restart the application if needed

**Audio Quality Issues:**
- Use higher quality voice settings
- Ensure good source audio for custom voices
- Check system audio settings
- Try different voice combinations

**Upload Failures:**
- Check internet connection
- Verify file isn't corrupted
- Try uploading a smaller file first
- Clear browser cache if using web version

### Performance Tips

**For Better Performance:**
- Close other resource-intensive applications
- Use shorter documents when possible
- Generate podcasts during off-peak hours
- Keep system updated

**Managing System Resources:**
- Monitor CPU and memory usage
- Allow adequate time for processing
- Use quality settings appropriate for your hardware
- Consider upgrading hardware for heavy usage

### Error Messages

**"ML Service Unavailable":**
- MLX models are not loaded
- Check system compatibility
- Restart the application
- Verify installation

**"Source Not Found":**
- Source may have been deleted
- Refresh sources panel
- Re-upload if necessary

**"Generation Failed":**
- Check source selection
- Verify system resources
- Try with different content
- Check error logs

## Tips and Best Practices

### Getting the Best Results

**Document Selection:**
- Use high-quality, well-structured PDFs
- Academic papers and reports work best
- Avoid heavily formatted documents
- Ensure text is machine-readable

**Question Asking:**
- Be specific and clear
- Ask one concept at a time
- Use proper terminology when available
- Build on previous questions for context

**Podcast Creation:**
- Select complementary documents for richer discussions
- Use dramatic enhancement for more engaging content
- Experiment with different voice combinations
- Consider your target audience

### Workflow Optimization

**Efficient Source Management:**
- Organize documents by project or topic
- Use descriptive filenames
- Remove unused sources regularly
- Keep source selection relevant to current task

**Chat Best Practices:**
- Start with broad questions, then get specific
- Save important conversations before clearing
- Use export features to preserve insights
- Take notes on key findings

**Content Creation Strategy:**
- Plan your podcast structure before generation
- Test voice combinations with short content first
- Create mind maps to visualize complex topics
- Use video features to enhance podcast content

### Collaboration and Sharing

**Sharing Content:**
- Export chats as PDFs for formal sharing
- Use HTML exports for web publishing
- Share podcast ZIPs for complete packages
- Create video content for presentations

**Team Workflows:**
- Establish naming conventions for sources
- Document useful question patterns
- Share successful voice configurations
- Create templates for common use cases

## Advanced Features

### Custom Voice Training

**Professional Voice Training:**
1. Record in a quiet environment
2. Use consistent microphone and settings
3. Include various speech patterns
4. Avoid background music or effects
5. Speak naturally and clearly

**Voice Quality Optimization:**
- Use lossless audio formats when possible
- Normalize audio levels
- Remove silence at beginning/end
- Ensure consistent speaking pace

### API Integration

For developers interested in integrating NotebookMLX:
- RESTful API available for all major functions
- Comprehensive API documentation in `/docs/API.md`
- Support for programmatic source management
- Webhook support for long-running tasks

### Customization Options

**Interface Customization:**
- Theme selection (light/dark)
- Panel layout preferences
- Keyboard shortcuts
- Export defaults

**Model Configuration:**
- Choose different MLX models for various tasks
- Adjust generation parameters
- Configure quality vs. speed tradeoffs
- Set resource limits

## Getting Help

### Support Resources

**Documentation:**
- Complete API documentation
- Component reference guides
- Architecture overview
- Development guides

**Community:**
- GitHub repository for issues and feature requests
- Discussion forums for user questions
- Example projects and use cases
- Regular updates and improvements

**Technical Support:**
- Error reporting system
- Diagnostic tools
- Performance monitoring
- Update notifications

Remember that NotebookMLX is continuously evolving. Check for updates regularly and consult the latest documentation for new features and improvements.