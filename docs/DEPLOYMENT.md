# NotebookMLX Deployment Guide

## Overview

NotebookMLX is an Electron-based desktop application with a FastAPI backend that provides MLX-powered AI capabilities for document processing and podcast generation. This guide covers enterprise-grade deployment strategies.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Architectures](#deployment-architectures)
3. [Production Setup](#production-setup)
4. [Security Configuration](#security-configuration)
5. [Monitoring Setup](#monitoring-setup)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Requirements:**
- macOS 10.15+ (for Apple Silicon MLX models)
- 8GB RAM (16GB+ recommended)
- 50GB free disk space
- Apple Silicon chip (M1/M2/M3) for optimal performance

**Development Environment:**
- Node.js 20+
- Python 3.11+
- Docker 20.10+
- Git

### Dependencies Installation

```bash
# macOS
brew install node python@3.11 docker git ffmpeg

# Enable pnpm
corepack enable

# Verify installations
node --version
python3 --version
docker --version
```

## Deployment Architectures

### 1. Desktop Application (Recommended)

The primary deployment model for NotebookMLX as a standalone desktop application.

**Architecture:**
```
┌─────────────────┐
│   Electron App  │
├─────────────────┤
│ React Frontend  │
│ (Port 3000)     │
├─────────────────┤
│ FastAPI Backend │
│ (Port 8000)     │
├─────────────────┤
│ MLX Models      │
│ Local Storage   │
└─────────────────┘
```

**Deployment Steps:**

1. **Clone and Setup:**
```bash
git clone <repository-url>
cd notebook-mlx-app
pnpm install
```

2. **Build for Production:**
```bash
# Quick build for M1 Mac
./build-m1.sh

# Or full build process
pnpm run build
pnpm run dist:mac
```

3. **Installation:**
```bash
# Install the generated .dmg file
open dist/NotebookMLX-*.dmg
```

### 2. Server Deployment (Advanced)

For organizations requiring centralized deployment.

**Architecture:**
```
┌─────────────────┐    ┌─────────────────┐
│   Web Client    │────│   Load Balancer │
└─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │ Backend Service │
                       │ (FastAPI)       │
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │ MLX Compute     │
                       │ Apple Silicon   │
                       └─────────────────┘
```

**Docker Deployment:**

```bash
# Standard backend deployment
docker-compose up -d

# With monitoring stack
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### 3. Development Setup

```bash
# Start development environment
pnpm run start

# Or individual components
pnpm run start:backend    # Backend only
pnpm run start:frontend   # Frontend only
```

## Production Setup

### 1. Environment Configuration

Create production environment file:

```bash
cp .env.production.template .env
```

Configure the following critical settings:

```env
# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
BACKEND_DATA_DIR=/opt/notebookmlx/data

# Security
ALLOWED_ORIGINS=app://.,null
BACKEND_MAX_UPLOAD_MB=200

# Performance
GEN_CONCURRENCY=2
EXPORT_RATE_LIMIT_PER_MIN=60

# Monitoring
PROMETHEUS_ENABLED=true
LOG_LEVEL=INFO
```

### 2. Data Directory Setup

```bash
# Create production data directories
sudo mkdir -p /opt/notebookmlx/data/{uploads,podcasts,tts,voices,processed}
sudo chown -R $USER:$USER /opt/notebookmlx
chmod 755 /opt/notebookmlx/data
```

### 3. System Service (macOS)

Create a LaunchDaemon for system-wide service:

```xml
<!-- /Library/LaunchDaemons/com.notebookmlx.backend.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.notebookmlx.backend</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/notebookmlx/python-dist/start-backend.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/opt/notebookmlx/logs/backend.log</string>
    <key>StandardErrorPath</key>
    <string>/opt/notebookmlx/logs/backend.error.log</string>
</dict>
</plist>
```

Load the service:
```bash
sudo launchctl load /Library/LaunchDaemons/com.notebookmlx.backend.plist
sudo launchctl start com.notebookmlx.backend
```

## Security Configuration

### 1. SSL/TLS Setup

For HTTPS deployment:

```bash
# Generate production certificates
openssl req -x509 -newkey rsa:4096 -keyout /opt/notebookmlx/certs/key.pem \
    -out /opt/notebookmlx/certs/cert.pem -days 365 -nodes \
    -subj "/C=US/ST=CA/L=SF/O=YourOrg/CN=your-domain.com"

# Set proper permissions
chmod 600 /opt/notebookmlx/certs/key.pem
chmod 644 /opt/notebookmlx/certs/cert.pem
```

### 2. Firewall Configuration

```bash
# macOS Firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/NotebookMLX.app
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /path/to/NotebookMLX.app
```

### 3. Code Signing (Production)

Set up development certificates:

```bash
# Import certificates
security import developer-certificate.p12 -P password -k ~/Library/Keychains/login.keychain

# Verify certificate
security find-identity -v -p codesigning
```

## Monitoring Setup

### 1. Prometheus Metrics

The application exposes metrics at `/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `podcast_generation_duration_seconds` - ML processing time
- `upload_requests_total` - File upload metrics

### 2. Log Aggregation

Logs are written to:
- Application: `${BACKEND_DATA_DIR}/app.log`
- System: `/var/log/notebookmlx/`

Configure log rotation:
```bash
# Create logrotate configuration
cat > /etc/logrotate.d/notebookmlx << EOF
/opt/notebookmlx/data/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 notebookmlx notebookmlx
}
EOF
```

### 3. Health Checks

The application provides health endpoints:

- `GET /healthz` - Basic health check
- `GET /metrics` - Prometheus metrics
- `GET /` - API status

Automated health monitoring:
```bash
# Add to crontab
*/5 * * * * curl -f http://localhost:8000/healthz || echo "NotebookMLX health check failed" | mail -s "Alert" admin@yourorg.com
```

## Performance Optimization

### 1. MLX Model Optimization

```python
# Configure model loading
DEFAULT_MODEL = "mlx-community/Qwen2.5-1.5B-Instruct-4bit"  # Faster inference
GEN_CONCURRENCY = 2  # Limit concurrent generations
```

### 2. Memory Management

```bash
# Monitor memory usage
ps aux | grep python
top -pid $(pgrep -f "main.py")

# Configure swap if needed (careful on SSDs)
sudo sysctl vm.swappiness=10
```

### 3. Disk Space Management

```bash
# Setup cleanup cron job
0 2 * * * find /opt/notebookmlx/data/uploads -mtime +7 -delete
0 3 * * * find /opt/notebookmlx/data/processed -mtime +30 -delete
```

## Backup and Recovery

### 1. Data Backup

```bash
# Run backup script
./scripts/backup-data.sh

# Or manual backup
tar -czf backup_$(date +%Y%m%d).tar.gz \
    /opt/notebookmlx/data \
    --exclude="*.log" \
    --exclude="uploads/chunks"
```

### 2. Database Backup

```bash
# SQLite backup
sqlite3 /opt/notebookmlx/data/notebookmlx.db ".backup backup.db"

# Copy with WAL files
cp /opt/notebookmlx/data/notebookmlx.db* /backup/location/
```

### 3. Restore Procedures

```bash
# Stop service
sudo launchctl stop com.notebookmlx.backend

# Restore data
tar -xzf backup_YYYYMMDD.tar.gz -C /

# Restart service
sudo launchctl start com.notebookmlx.backend
```

## Troubleshooting

### Common Issues

**1. MLX Models Not Loading**
```bash
# Check MLX availability
python3 -c "import mlx.core; print('MLX available')"

# Verify Apple Silicon
sysctl machdep.cpu.brand_string
```

**2. Port Conflicts**
```bash
# Check port usage
lsof -i :8000
lsof -i :3000

# Kill conflicting processes
sudo kill -9 $(lsof -ti :8000)
```

**3. Permission Issues**
```bash
# Fix data directory permissions
sudo chown -R $(whoami):staff /opt/notebookmlx/data
chmod -R 755 /opt/notebookmlx/data
```

**4. Memory Issues**
```bash
# Monitor memory
vm_stat
ps aux --sort=-%mem | head

# Reduce concurrency
export GEN_CONCURRENCY=1
```

### Log Analysis

```bash
# View application logs
tail -f /opt/notebookmlx/data/app.log

# Search for errors
grep -i error /opt/notebookmlx/data/app.log

# Monitor real-time requests
tail -f /opt/notebookmlx/data/app.log | jq '.method + " " + .path + " " + (.status|tostring)'
```

### Performance Monitoring

```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8000/healthz"

# Monitor resource usage
iostat -x 1
htop
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Daily:**
   - Check application health
   - Review error logs
   - Monitor disk space

2. **Weekly:**
   - Update MLX models if needed
   - Review security logs
   - Test backup procedures

3. **Monthly:**
   - Update dependencies
   - Review performance metrics
   - Security audit

### Getting Help

- Check application logs first
- Review this documentation
- Search existing issues in the repository
- File bug reports with full system information

For enterprise support, contact the development team with:
- System specifications
- Error logs
- Steps to reproduce
- Expected vs actual behavior