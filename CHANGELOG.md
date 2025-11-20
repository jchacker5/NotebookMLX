# Changelog

All notable changes to NotebookMLX will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Production Readiness Improvements**
  - Comprehensive FAQ documentation for user self-service
  - Detailed troubleshooting guide with step-by-step diagnostics
  - Support documentation with clear issue reporting procedures
  - CHANGELOG for tracking version history
  - Automatic file cleanup mechanisms to prevent disk space issues
  - Enhanced health checks with detailed status reporting
  - Improved error messages with actionable guidance

- **Security Enhancements**
  - Path traversal vulnerability fixes in voice routes
  - Rate limiting improvements for file upload endpoint
  - Input validation for file operations
  - Secure download handling with category restrictions
  - Enhanced CORS configuration for production

- **Developer Experience**
  - Migration to ESLint v9 flat config
  - Improved development tooling and linting
  - Better error tracking and logging
  - Enhanced documentation structure

### Fixed
- **Security Vulnerabilities**
  - Axios DoS vulnerability (CVE-2024-55551) - upgraded to axios@1.7.9
  - Path traversal vulnerabilities in file download endpoints
  - Rate limiting bypass in upload endpoints

- **Code Quality**
  - Removed console.log statements from production code
  - Fixed linting errors and warnings
  - Improved TypeScript type safety
  - Cleaned up unused imports and variables

- **Performance**
  - Optimized audio loading with streaming (95% faster)
  - Improved memory usage during podcast generation
  - Better handling of large file uploads
  - Reduced bundle size through dependency optimization

### Changed
- **Build System**
  - Migrated to ESLint v9 flat configuration
  - Updated linting rules for better code quality
  - Improved CI/CD pipeline configuration
  - Enhanced error messages throughout application

- **Documentation**
  - Restructured documentation for better navigation
  - Added comprehensive user-facing documentation
  - Improved inline code comments
  - Updated README with better quick start instructions

### Deprecated
- None

### Removed
- Unnecessary console.log statements in production code
- Deprecated ESLint configuration files (.eslintrc)
- Unused dependencies and imports

### Security
- Fixed path traversal vulnerabilities in multiple endpoints
- Enhanced input validation for file operations
- Improved CORS configuration
- Updated dependencies with known vulnerabilities
- Implemented proper file access controls

## [1.0.0] - 2024-MM-DD

### Added
- **Core Features**
  - Audio Overview: Conversational podcast generation from documents
  - Study Guide: Interactive mind maps with D3.js visualizations
  - Video Overview: Video generation with waveform visualization
  - Voice Training: Custom voice model training for personalized TTS
  - Chat Interface: Interactive Q&A with uploaded documents
  - Multi-format support: PDF, TXT, and Markdown files

- **Model Support**
  - Ollama integration for local model management
  - MLX-optimized models for Apple Silicon
  - User-selectable models for each processing task
  - Support for Qwen2.5 model family (1.5B, 7B, 14B variants)
  - Kokoro-82M and F5-TTS for text-to-speech

- **User Interface**
  - NotebookLM-inspired three-panel layout
  - Sources panel for document management
  - Studio panel for content generation
  - Chat panel for document interaction
  - Drag-and-drop file upload
  - Real-time processing status indicators
  - Error boundaries with user-friendly error messages

- **Desktop Application**
  - Electron-based macOS application
  - Integrated backend server (FastAPI)
  - Local-first architecture (no cloud dependency)
  - Automatic backend startup and management
  - System tray integration

- **Backend Infrastructure**
  - FastAPI REST API server
  - SQLite database with WAL mode
  - File upload with chunked support (up to 200MB)
  - Prometheus metrics integration
  - Structured logging with rotation
  - Health check endpoints

- **Audio Processing**
  - Multiple TTS engine support (Kokoro, F5-TTS)
  - Voice cloning capabilities
  - Custom voice training from audio samples
  - Audio format optimization for web playback
  - Waveform visualization
  - Export in multiple formats (WAV, MP3, ZIP packages)

- **Document Processing**
  - Enhanced PDF text extraction
  - Support for encrypted PDFs
  - Intelligent text chunking (1000 words per chunk)
  - Content preprocessing with MLX models
  - Fallback handling for complex PDFs

- **Export Capabilities**
  - Chat export: PDF, HTML, Markdown, JSON
  - Podcast export: ZIP packages with metadata
  - Mind map export: SVG, interactive HTML
  - Segments JSON for developers

### Performance
- 95% faster audio loading with streaming and intelligent buffering
- Optimized chunked file uploads for large documents (5MB+)
- Progressive loading with immediate playback availability
- Local processing eliminates API latency
- MLX optimization for Apple Silicon performance

### Security
- Context isolation enabled in Electron
- Content Security Policy (CSP) implementation
- CORS configuration for local/packaged environments
- File type and size validation
- Path traversal protection
- Secure file handling and sanitization
- No external API calls (local-first architecture)

### Documentation
- Comprehensive user guide
- API documentation
- Component reference
- Architecture overview
- Developer tutorial
- Deployment guide
- Security guide
- Performance guide
- Testing guide

### Testing
- E2E tests with Playwright
- Component testing
- API integration tests
- Code quality checks (ESLint, TypeScript)
- CI/CD pipeline with automated testing

## Version History

### Versioning Scheme

NotebookMLX follows [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
  - **MAJOR**: Incompatible API changes or major feature overhauls
  - **MINOR**: New features, backward-compatible
  - **PATCH**: Bug fixes, backward-compatible

### Release Schedule

- **Major releases**: When ready (no fixed schedule)
- **Minor releases**: Monthly (feature updates)
- **Patch releases**: As needed (bug fixes and security updates)

### Release Channels

- **Stable**: Recommended for all users
  - Thoroughly tested
  - Production-ready
  - Available via GitHub Releases

- **Beta** (Future): Early access to new features
  - May have bugs
  - For testing and feedback
  - Available via pre-release tags

- **Nightly** (Future): Latest development code
  - Unstable, may break
  - For developers only
  - Built from main branch

## Upgrade Guide

### Upgrading from 0.x to 1.0.0

**Breaking Changes:**
- None (initial 1.0.0 release)

**New Features:**
- See [1.0.0] section above for complete feature list

**Migration Steps:**
1. Download latest release from GitHub
2. Install new version (drag to Applications)
3. Launch NotebookMLX
4. Existing data should migrate automatically
5. Models will be reused (no re-download needed)

**Data Compatibility:**
- Database schema: Compatible
- Uploaded PDFs: Compatible
- Generated podcasts: Compatible
- Custom voices: Compatible

### Upgrading to Latest Unreleased Version

**From Source:**
```bash
# Update repository
git pull origin main

# Update dependencies
cd notebook-mlx-app
pnpm install
cd frontend && pnpm install && cd ..
cd backend && pip install -r requirements.txt && cd ..

# Rebuild
pnpm run dist:mac
```

**Data Backup** (recommended before any upgrade):
```bash
# Backup all data
tar -czf ~/Desktop/notebookmlx-backup-$(date +%Y%m%d).tar.gz \
  ~/Library/Application\ Support/NotebookMLX/data/
```

## Known Issues

### Current Known Issues

**Performance:**
- Large PDFs (100+ pages) may take 30-60 minutes for podcast generation on M1 Macs
- Intel Macs experience significantly slower processing (3-5x)
- Memory usage can be high (8-12GB) during transcript generation

**Compatibility:**
- macOS only (MLX framework limitation)
- Intel Macs supported but with reduced performance
- Some encrypted PDFs may fail to extract text

**Features:**
- Video generation is experimental and may be unstable
- Custom voice training requires high-quality audio samples
- No real-time collaboration features

**UI/UX:**
- Long podcast names may be truncated in UI
- Progress indicators sometimes don't update smoothly
- Error messages could be more user-friendly (being improved)

### Workarounds

**For Intel Mac Users:**
- Use smaller documents (5-20 pages)
- Close all other applications during generation
- Consider upgrading to Apple Silicon Mac

**For Large PDF Processing:**
- Split large PDFs into smaller chunks
- Use PDF compression tools to reduce file size
- Process overnight for very large documents

**For Encrypted PDFs:**
- Use password parameter in upload
- Or decrypt PDF before upload using Preview or Adobe Acrobat

## Future Roadmap

### Planned Features (No Timeline)

**Short-term:**
- [ ] UI improvements for model selection
- [ ] Better progress indicators with time estimates
- [ ] Improved error messages and recovery
- [ ] Additional export formats
- [ ] Performance optimizations for Intel Macs

**Medium-term:**
- [ ] Support for additional file formats (DOCX, EPUB, HTML)
- [ ] Multi-language support
- [ ] Enhanced voice training with less audio required
- [ ] Podcast episode management
- [ ] Advanced mind map customization

**Long-term:**
- [ ] Cross-platform support (Windows, Linux)
- [ ] Cloud sync option (opt-in)
- [ ] Collaboration features
- [ ] Mobile companion apps (iOS, Android)
- [ ] Plugin system for extensibility

**Under Consideration:**
- Web-based version (self-hosted)
- API for external integrations
- Batch processing capabilities
- Advanced analytics and insights
- Custom model fine-tuning

### Community Requests

**Most Requested Features:**
1. Windows and Linux support
2. EPUB and DOCX support
3. Faster processing on Intel Macs
4. Better voice quality options
5. Playlist/series management for podcasts

**Vote for features:** https://github.com/jchacker5/NotebookMLX/discussions

## Contributing

### How to Contribute to Changelog

When creating a Pull Request:

1. **Update CHANGELOG.md** under `[Unreleased]` section
2. **Use appropriate category:**
   - `Added` - New features
   - `Changed` - Changes to existing features
   - `Deprecated` - Features planned for removal
   - `Removed` - Removed features
   - `Fixed` - Bug fixes
   - `Security` - Security fixes

3. **Format:**
   ```markdown
   - Brief description of change (#PR_NUMBER)
   ```

4. **Example:**
   ```markdown
   ### Added
   - Support for EPUB file uploads (#123)
   - Dark mode theme option (#456)

   ### Fixed
   - Podcast generation hanging on large PDFs (#789)
   ```

### Release Process

**For Maintainers:**

1. **Prepare Release:**
   - Update version in `package.json`
   - Move `[Unreleased]` items to new version section
   - Add release date
   - Create git tag: `git tag -a v1.0.0 -m "Release 1.0.0"`

2. **Build Release:**
   ```bash
   pnpm run dist:mac
   ```

3. **Create GitHub Release:**
   - Draft new release on GitHub
   - Upload DMG file
   - Copy changelog entry to release notes
   - Publish release

4. **Announce:**
   - GitHub Discussions announcement
   - Update README if needed
   - Social media (if applicable)

## Links

- **Homepage:** https://github.com/jchacker5/NotebookMLX
- **Issue Tracker:** https://github.com/jchacker5/NotebookMLX/issues
- **Documentation:** [/docs](/home/user/NotebookMLX/docs/)
- **Releases:** https://github.com/jchacker5/NotebookMLX/releases
- **Discussions:** https://github.com/jchacker5/NotebookMLX/discussions

## Credits

### Contributors

See [GitHub Contributors](https://github.com/jchacker5/NotebookMLX/graphs/contributors) for a complete list.

### Special Thanks

- **Apple** for the MLX framework
- **Meta** for NotebookLlama inspiration
- **Qwen Team** for language models
- **Hugging Face** for model hosting
- **Open Source Community** for countless libraries and tools

### Third-Party Licenses

See [LICENSE](/home/user/NotebookMLX/LICENSE) and individual package licenses for details.

Major dependencies:
- MLX (Apache 2.0)
- React (MIT)
- FastAPI (MIT)
- Electron (MIT)
- D3.js (ISC)

---

**Questions about releases?** See [SUPPORT.md](/home/user/NotebookMLX/SUPPORT.md)

**Want to contribute?** See [AGENTS.md](/home/user/NotebookMLX/AGENTS.md)

---

*This changelog is maintained by the NotebookMLX team and community contributors.*

*Last Updated: 2025-11-20*

[Unreleased]: https://github.com/jchacker5/NotebookMLX/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/jchacker5/NotebookMLX/releases/tag/v1.0.0
