# NotebookMLX - Support

Welcome to NotebookMLX support! This guide explains how to get help, report issues, and contribute to the project.

**Quick Links:**
- [Self-Help Resources](#self-help-resources)
- [Community Support](#community-support)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Security Issues](#security-issues)
- [Response Times](#response-times)
- [Contributing](#contributing)
- [Commercial Support](#commercial-support)

---

## Self-Help Resources

**Before asking for help, please check these resources** - most questions are already answered!

### Documentation

**User Documentation:**
- **[FAQ (Frequently Asked Questions)](/home/user/NotebookMLX/FAQ.md)** - Common questions and answers
- **[User Guide](/home/user/NotebookMLX/docs/USER_GUIDE.md)** - Comprehensive feature documentation
- **[Troubleshooting Guide](/home/user/NotebookMLX/TROUBLESHOOTING.md)** - Step-by-step diagnostic procedures
- **[Installation Guide](/home/user/NotebookMLX/notebook-mlx-app/INSTALL.md)** - Setup and installation instructions
- **[Quick Start](/home/user/NotebookMLX/QUICK_START.md)** - Get up and running in 5 minutes

**Developer Documentation:**
- **[Developer Tutorial](/home/user/NotebookMLX/docs/DEVELOPER_TUTORIAL.md)** - Complete development guide
- **[API Documentation](/home/user/NotebookMLX/docs/API.md)** - API reference
- **[Component Documentation](/home/user/NotebookMLX/docs/COMPONENTS.md)** - React component reference
- **[Architecture Overview](/home/user/NotebookMLX/docs/ARCHITECTURE.md)** - System design

**Technical Documentation:**
- **[Backend Guide](/home/user/NotebookMLX/docs/BACKEND.md)** - FastAPI backend details
- **[Frontend Guide](/home/user/NotebookMLX/docs/FRONTEND.md)** - React frontend architecture
- **[Performance Guide](/home/user/NotebookMLX/docs/PERFORMANCE.md)** - Optimization strategies
- **[Security Guide](/home/user/NotebookMLX/docs/SECURITY.md)** - Security best practices
- **[Deployment Guide](/home/user/NotebookMLX/docs/DEPLOYMENT.md)** - Production deployment

### Quick Diagnostic Steps

**1. Check System Requirements**
```bash
# Verify your system meets minimum requirements
sw_vers                        # macOS 10.15+ required
python3 --version              # Python 3.11+ required
node --version                 # Node 20+ required
df -h ~                        # 15GB+ free space needed
```

**2. Check Application Status**
```bash
# Verify backend is running
curl http://localhost:8000/healthz
# Should return: {"status": "ok"}

# Check logs for errors
tail -50 ~/Library/Application\ Support/NotebookMLX/logs/app.log | grep -i error
```

**3. Common Quick Fixes**

| Issue | Quick Fix |
|-------|-----------|
| Backend not responding | Restart NotebookMLX |
| Upload fails | Check file size (<200MB) and format (PDF/TXT/MD only) |
| Slow generation | Close other apps, check Activity Monitor for memory pressure |
| Models not downloading | Check internet connection and disk space (need 15GB+) |
| App won't start | Run: `sudo xattr -rd com.apple.quarantine /Applications/NotebookMLX.app` |

### Search Existing Issues

Before creating a new issue, search to see if someone else has already reported it:

**GitHub Issues Search:**
https://github.com/jchacker5/NotebookMLX/issues

**Search Tips:**
- Use keywords from your error message
- Try both open and closed issues
- Check issue labels (bug, enhancement, documentation, etc.)
- Sort by recent activity for latest discussions

**Common Labels:**
- `bug` - Something isn't working
- `enhancement` - Feature requests
- `documentation` - Documentation improvements
- `help wanted` - Community can contribute
- `good first issue` - Beginner-friendly contributions
- `question` - General questions

---

## Community Support

### GitHub Discussions

**General Questions, Ideas, and Community Help:**

**Link:** https://github.com/jchacker5/NotebookMLX/discussions

**Categories:**
- **General** - General questions and discussions
- **Ideas** - Feature ideas and suggestions
- **Q&A** - Ask the community for help
- **Show and Tell** - Share what you've built with NotebookMLX
- **Announcements** - Project updates and news

**Best For:**
- "How do I...?" questions
- Usage tips and best practices
- Sharing your podcast creations
- Feature discussions before formal requests
- Performance optimization questions
- Model selection advice

**Response Time:** Community-driven, usually within 24-48 hours

### Community Forums

**Future Community Channels** (Coming Soon):

We're exploring additional community platforms:
- Discord server for real-time chat
- Reddit community for discussions
- Stack Overflow tag for technical Q&A

**Current Status:** GitHub Discussions is the primary community channel

### Social Media

**Follow for Updates:**
- GitHub: [@jchacker5](https://github.com/jchacker5)
- Project Repository: https://github.com/jchacker5/NotebookMLX

**Announcements:**
- Watch the repository for release notifications
- Star the repo to show support and stay updated
- Follow releases: https://github.com/jchacker5/NotebookMLX/releases

---

## Reporting Bugs

### Before Reporting

**1. Verify it's actually a bug:**
- Check [FAQ.md](/home/user/NotebookMLX/FAQ.md) for known limitations
- Review [TROUBLESHOOTING.md](/home/user/NotebookMLX/TROUBLESHOOTING.md) for fixes
- Ensure you're running the latest version

**2. Check if already reported:**
- Search [existing issues](https://github.com/jchacker5/NotebookMLX/issues)
- Include both open and closed issues in search
- If found, add a comment with your experience (don't create duplicate)

**3. Gather diagnostic information:**
- System details (macOS version, Mac model, RAM)
- NotebookMLX version
- Steps to reproduce
- Error messages and logs
- Screenshots if applicable

### Where to Report

**GitHub Issues (Preferred):**
https://github.com/jchacker5/NotebookMLX/issues/new

**Click "New Issue" → Choose "Bug Report" template**

### What to Include in Bug Report

**Required Information:**

**1. Environment Details**
```
macOS Version: [e.g., macOS 14.0 Sonoma]
Mac Model: [e.g., MacBook Pro M2, 16GB RAM]
Processor: [Apple Silicon M1/M2/M3 or Intel]
NotebookMLX Version: [e.g., 1.0.0]
```

**2. Steps to Reproduce**
```
Clear, numbered steps to reproduce the issue:
1. Launch NotebookMLX
2. Upload a 50MB PDF file
3. Select document and click "Generate Podcast"
4. Wait 15 minutes - generation fails at 75% progress
```

**3. Expected vs Actual Behavior**
```
Expected: Podcast generates successfully and can be played
Actual: Generation fails with error "Model not found: Qwen2.5-14B"
```

**4. Screenshots**

Attach screenshots showing:
- Error messages
- Console errors (if in dev mode)
- Activity Monitor during issue
- Application state when bug occurs

**5. Error Messages (Exact Text)**
```
Copy and paste exact error messages, including:
- On-screen error toasts
- Console errors
- Backend log errors
```

**6. Log Files**

**Collect and attach logs:**
```bash
# Create diagnostic bundle
tail -100 ~/Library/Application\ Support/NotebookMLX/logs/app.log > ~/Desktop/notebookmlx-logs.txt

# System info
sw_vers > ~/Desktop/system-info.txt
python3 --version >> ~/Desktop/system-info.txt
node --version >> ~/Desktop/system-info.txt
```

Attach:
- `notebookmlx-logs.txt`
- `system-info.txt`
- Crash reports (if app crashed): `~/Library/Logs/DiagnosticReports/NotebookMLX-*`

**7. Additional Context**

- Does this happen consistently or intermittently?
- Did this work in a previous version?
- Have you made any system changes recently?
- Are you using any custom configurations?
- File sizes/types involved (if relevant)

### Bug Report Template

```markdown
**Environment**
- macOS Version:
- Mac Model:
- Processor: [Apple Silicon / Intel]
- RAM:
- NotebookMLX Version:

**Description**
[Clear, concise description of the bug]

**Steps to Reproduce**
1.
2.
3.

**Expected Behavior**
[What you expected to happen]

**Actual Behavior**
[What actually happened]

**Screenshots**
[If applicable, add screenshots]

**Error Messages**
```
[Paste error messages here]
```

**Logs**
[Attach log files]

**Additional Context**
[Any other relevant information]
```

### Sensitive Data Warning

**⚠️ DO NOT include sensitive information in bug reports:**
- Personal documents (PDFs containing private info)
- API keys or credentials
- Private file paths with usernames
- Proprietary business information

**Instead:**
- Use example/test documents
- Redact sensitive paths: `/Users/[REDACTED]/Documents/...`
- Describe document content generically: "30-page research paper"

### What Happens After Reporting

**Bug Triage Process:**

1. **Submission** - Your bug report is created
2. **Initial Review** (1-3 days) - Maintainers review and may ask for clarification
3. **Label Assignment** - Issue is labeled (bug, priority, component)
4. **Diagnosis** (varies) - Team investigates root cause
5. **Fix Development** (varies) - Developer creates fix
6. **Testing** - Fix is tested in development environment
7. **Release** - Fix included in next release
8. **Closure** - Issue closed, you're notified

**You may be asked to:**
- Provide additional information
- Test a proposed fix
- Try a workaround
- Confirm the bug is fixed

**Priority Levels:**

| Priority | Description | Typical Response Time |
|----------|-------------|----------------------|
| **Critical** | App crashes, data loss, security | 24-48 hours |
| **High** | Major feature broken, no workaround | 3-7 days |
| **Medium** | Feature impaired, workaround exists | 1-2 weeks |
| **Low** | Minor annoyance, cosmetic issues | Best effort |

---

## Feature Requests

### Before Requesting

**1. Check if already requested:**
- Search [issues labeled "enhancement"](https://github.com/jchacker5/NotebookMLX/labels/enhancement)
- Check [GitHub Discussions](https://github.com/jchacker5/NotebookMLX/discussions)
- Review [project roadmap](https://github.com/jchacker5/NotebookMLX/projects) (if available)

**2. Consider:**
- Does this fit NotebookMLX's scope and vision?
- Would this benefit many users or just you?
- Are there existing workarounds?
- Is this technically feasible with current architecture?

### Where to Submit

**For Well-Defined Feature Requests:**
https://github.com/jchacker5/NotebookMLX/issues/new

**For Ideas and Discussion:**
https://github.com/jchacker5/NotebookMLX/discussions/categories/ideas

### What to Include

**Feature Request Template:**

```markdown
**Feature Title**
[Clear, concise title - e.g., "Add support for EPUB file uploads"]

**Problem Statement**
[What problem does this solve?]
Example: "I have many EPUB books I'd like to convert to podcasts, but NotebookMLX only supports PDFs."

**Proposed Solution**
[How should this feature work?]
Example: "Add EPUB to the supported file formats, extract text like PDFs, and process normally."

**Alternatives Considered**
[What other approaches could work?]
Example: "Manually convert EPUB to PDF first, but this loses formatting and is tedious."

**Use Cases**
[Who benefits and how?]
- Students processing textbook EPUBs
- Researchers with EPUB papers
- Book readers wanting audio versions

**Additional Context**
[Screenshots, mockups, examples from other apps]

**Willingness to Contribute**
[ ] I'd like to implement this myself (with guidance)
[ ] I can help test this feature
[ ] I can only request, not contribute
```

### Feature Request Evaluation

**How Feature Requests are Evaluated:**

**Criteria:**
1. **Alignment** - Fits project vision and scope
2. **Impact** - Benefits many users, not just one
3. **Feasibility** - Technically possible with reasonable effort
4. **Maintainability** - Won't add significant maintenance burden
5. **Resources** - Team has time/expertise to implement

**Possible Outcomes:**

| Status | Meaning |
|--------|---------|
| **Accepted** | Planned for development (added to roadmap) |
| **Under Consideration** | Good idea, needs more discussion/planning |
| **Deferred** | Good idea but low priority, may revisit later |
| **Declined** | Won't implement (with explanation) |
| **Help Wanted** | Accepted but needs community contribution |

**Response Time:** Feature requests are reviewed monthly

### Voting on Features

**Upvote feature requests you'd like to see:**
- Click 👍 reaction on the issue
- Add a comment explaining your use case
- Star/watch the repository for updates

**Features with more upvotes** receive higher priority (but aren't guaranteed).

---

## Security Issues

### Reporting Security Vulnerabilities

**⚠️ DO NOT report security vulnerabilities in public issues!**

### Private Disclosure Process

**For security vulnerabilities, please report privately:**

**Email:** [Report via GitHub Security Advisories](https://github.com/jchacker5/NotebookMLX/security/advisories/new)

**Or:**
- Create a **private** security advisory on GitHub
- Include detailed description and proof-of-concept (if safe)
- Wait for acknowledgment before public disclosure

**What to Include:**

1. **Vulnerability Description**
   - Type of vulnerability (e.g., SQL injection, XSS, path traversal)
   - Affected component/file
   - Severity assessment

2. **Steps to Reproduce**
   - Detailed reproduction steps
   - Proof-of-concept code (if applicable)
   - Screenshots/videos

3. **Impact Assessment**
   - What can an attacker do?
   - What data is at risk?
   - Are users affected?

4. **Suggested Fix** (if you have one)
   - How to remediate
   - Code patches (if developed)

### Security Response Process

**Timeline:**

1. **Acknowledgment** - Within 48-72 hours
2. **Initial Assessment** - Within 1 week
3. **Fix Development** - Depends on severity
   - Critical: Within days
   - High: Within 1-2 weeks
   - Medium: Within 1 month
4. **Testing** - Before release
5. **Disclosure** - Coordinated with reporter
6. **Release** - Security patch released
7. **Public Announcement** - After users can update

**Severity Levels:**

| Severity | Description | Example |
|----------|-------------|---------|
| **Critical** | Remote code execution, data exfiltration | Arbitrary file read/write |
| **High** | Significant security bypass | Auth bypass, privilege escalation |
| **Medium** | Limited security impact | XSS, CSRF (local app context) |
| **Low** | Minimal security risk | Information disclosure |

**Credit:**
- Security researchers will be credited in release notes (unless anonymous requested)
- Hall of fame for responsible disclosures (future)

### Security Best Practices

**For Users:**
- Keep NotebookMLX updated to latest version
- Only install from official sources (GitHub releases)
- Review [docs/SECURITY.md](/home/user/NotebookMLX/docs/SECURITY.md) for best practices
- Don't share data directories or databases publicly

**For Developers:**
- Review [docs/SECURITY.md](/home/user/NotebookMLX/docs/SECURITY.md)
- Run security scans: `npm audit`, `pip-audit`
- Follow secure coding practices
- Never commit secrets to git

---

## Response Times

### Expected Response Times

**These are best-effort estimates, not guarantees:**

| Type | Initial Response | Resolution Time |
|------|------------------|-----------------|
| **Critical Bugs** | 24-48 hours | Days to 1 week |
| **Security Issues** | 48-72 hours | Varies by severity |
| **High Priority Bugs** | 3-7 days | 1-2 weeks |
| **Medium Bugs** | 1 week | 2-4 weeks |
| **Low Priority Bugs** | Best effort | Varies |
| **Feature Requests** | Monthly review | Varies (months) |
| **Questions** | Community-driven | 24-48 hours |
| **Documentation** | 1 week | 1-2 weeks |

**Factors Affecting Response Time:**
- Maintainer availability (this is an open-source project)
- Complexity of issue
- Information provided (complete reports get faster responses)
- Community contributions
- Current workload

**Holidays and Breaks:**
- Response times may be longer during holidays
- Major releases may delay other work

### Service Level Expectations

**NotebookMLX is a community-supported open-source project:**
- ✅ Best-effort support from maintainers and community
- ✅ Regular updates and improvements
- ✅ Security issues prioritized
- ❌ No guaranteed SLA (Service Level Agreement)
- ❌ No 24/7 support
- ❌ No guaranteed fix timeframes

**For urgent business needs:** See [Commercial Support](#commercial-support)

---

## Contributing

### How to Contribute

**We welcome contributions!** There are many ways to help:

**Non-Code Contributions:**
- 📝 Improve documentation
- 🐛 Report bugs with detailed information
- 💡 Suggest features and improvements
- ❓ Answer questions in Discussions
- 🎨 Create tutorials and guides
- 🌍 Translate documentation
- ⭐ Star the repository
- 📣 Share NotebookMLX with others

**Code Contributions:**
- 🔧 Fix bugs
- ✨ Implement features
- 🧪 Write tests
- ⚡ Improve performance
- 🏗️ Refactor code
- 🎨 Enhance UI/UX

### Contribution Guidelines

**See detailed guidelines:**
- **[AGENTS.md](/home/user/NotebookMLX/AGENTS.md)** - Repository guidelines for contributors
- **[Developer Tutorial](/home/user/NotebookMLX/docs/DEVELOPER_TUTORIAL.md)** - Development setup
- **[Architecture Overview](/home/user/NotebookMLX/docs/ARCHITECTURE.md)** - Understand the codebase

**Quick Start for Contributors:**

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/YOUR_USERNAME/NotebookMLX.git
   cd NotebookMLX
   ```

2. **Set up development environment**
   ```bash
   cd notebook-mlx-app
   pnpm install
   cd backend && pip install -r requirements.txt
   ```

3. **Create a branch**
   ```bash
   git checkout -b fix/issue-123-upload-bug
   ```

4. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

5. **Test your changes**
   ```bash
   # Frontend tests
   cd frontend && pnpm test

   # Backend tests
   cd backend && pytest

   # E2E tests
   cd frontend && pnpm test:e2e
   ```

6. **Commit and push**
   ```bash
   git add .
   git commit -m "fix: resolve upload bug for files over 100MB"
   git push origin fix/issue-123-upload-bug
   ```

7. **Create Pull Request**
   - Go to GitHub and click "New Pull Request"
   - Fill out PR template
   - Link related issues
   - Wait for review

### Pull Request Process

**PR Requirements:**
- Clear description of changes
- Tests pass (CI/CD checks)
- Documentation updated (if needed)
- Code style follows project conventions
- No merge conflicts
- Linked to related issue (if applicable)

**Review Process:**
1. **Automated Checks** - CI/CD runs tests and linting
2. **Code Review** - Maintainer reviews code
3. **Changes Requested** (if needed) - Address feedback
4. **Approval** - Maintainer approves
5. **Merge** - Changes merged to main branch
6. **Release** - Included in next version

**Review Time:** Usually within 1 week for PRs with good descriptions and passing tests

### Good First Issues

**New to open source or NotebookMLX?** Look for issues labeled:
- `good first issue` - Beginner-friendly
- `help wanted` - Community contributions welcome
- `documentation` - Improve docs (no code required)

**Browse Good First Issues:**
https://github.com/jchacker5/NotebookMLX/labels/good%20first%20issue

### Code of Conduct

**Be respectful and professional:**
- Welcome newcomers
- Be patient with questions
- Provide constructive feedback
- Focus on ideas, not individuals
- Respect differing viewpoints

**Unacceptable behavior:**
- Harassment or discriminatory language
- Personal attacks
- Spam or off-topic content
- Sharing others' private information

**Enforcement:** Violations may result in warnings, temporary bans, or permanent bans

---

## Commercial Support

### Enterprise Support

**NotebookMLX is currently a community-supported open-source project.**

**Commercial/Enterprise support is NOT currently available.**

### Future Commercial Options

**Potential future offerings** (no timeline):
- Priority bug fixes
- Feature development
- Custom integrations
- Training and onboarding
- SLA-backed support

**Interested in commercial support?** Email: [Contact via GitHub profile](https://github.com/jchacker5)

### Consulting and Custom Development

**For custom development needs:**
- Large-scale deployments
- Custom model integrations
- White-label versions
- Enterprise features

**Contact:** See GitHub profile for contact information

### Sponsorship

**Support ongoing development:**
- GitHub Sponsors (if available)
- Patreon (if available)
- One-time donations (if available)

**Sponsors receive:**
- Recognition in README and release notes
- Influence on feature prioritization
- Early access to new features (tier-dependent)

**Check:** https://github.com/jchacker5/NotebookMLX for sponsorship links

---

## Additional Resources

### Learning Resources

**Tutorials and Guides:**
- [YouTube Tutorials] (Coming soon)
- [Blog Posts] (Coming soon)
- [Example Projects] (Coming soon)

**Community Content:**
- Share your tutorials in GitHub Discussions
- Create and share use cases
- Write blog posts about NotebookMLX

### Related Projects

**Apple MLX Ecosystem:**
- [MLX](https://github.com/ml-explore/mlx) - Apple's ML framework
- [MLX Examples](https://github.com/ml-explore/mlx-examples) - Example projects

**Similar Projects:**
- [NotebookLM](https://notebooklm.google.com/) - Google's cloud version
- [LM Studio](https://lmstudio.ai/) - Local LLM runner
- [Ollama](https://ollama.ai/) - Local model management

### Stay Updated

**Get Notified:**
- Watch repository for releases
- Star the repository
- Follow [@jchacker5](https://github.com/jchacker5)

**Release Channels:**
- GitHub Releases: https://github.com/jchacker5/NotebookMLX/releases
- Release Notes: Check CHANGELOG.md

**Community Updates:**
- GitHub Discussions announcements
- Repository README updates

---

## Contact

### General Inquiries

**GitHub:** [@jchacker5](https://github.com/jchacker5)

**Project Repository:** https://github.com/jchacker5/NotebookMLX

### Quick Contact Decision Tree

```
Do you have a...

├─ General question?
│  └─ Post in GitHub Discussions (Q&A)
│
├─ Bug to report?
│  ├─ Security vulnerability?
│  │  └─ Private security advisory
│  └─ Regular bug?
│     └─ GitHub Issues (use bug template)
│
├─ Feature idea?
│  ├─ Just an idea?
│  │  └─ GitHub Discussions (Ideas)
│  └─ Well-defined request?
│     └─ GitHub Issues (use feature template)
│
├─ Want to contribute?
│  └─ See AGENTS.md and Developer Tutorial
│
└─ Commercial inquiry?
   └─ Email via GitHub profile
```

---

## Acknowledgments

**Thank You:**
- All contributors to NotebookMLX
- Apple for the MLX framework
- Open-source community
- Users providing feedback and bug reports

**Contributors:**
See [GitHub Contributors](https://github.com/jchacker5/NotebookMLX/graphs/contributors)

---

**Remember:**
1. 📚 Check docs first
2. 🔍 Search existing issues
3. ✍️ Provide complete information
4. 🤝 Be respectful and patient
5. 💚 Contribute back when you can

**Thank you for using NotebookMLX!** 🎉

---

*Last Updated: 2025-11-20*
