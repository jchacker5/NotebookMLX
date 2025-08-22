#!/bin/bash

# Security Setup Script for NotebookMLX Production Deployment
# This script configures security settings for production environments

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔒 NotebookMLX Security Setup"
echo "=============================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Create security directories
echo "📁 Creating security directories..."
mkdir -p "$PROJECT_ROOT/security/certs"
mkdir -p "$PROJECT_ROOT/security/keys"
mkdir -p "$PROJECT_ROOT/security/policies"

# Set proper permissions
chmod 700 "$PROJECT_ROOT/security"
chmod 700 "$PROJECT_ROOT/security/certs"
chmod 700 "$PROJECT_ROOT/security/keys"

# Generate self-signed certificates for development
echo "🔑 Generating development certificates..."
if [ ! -f "$PROJECT_ROOT/security/certs/dev-cert.pem" ]; then
    openssl req -x509 -newkey rsa:4096 -keyout "$PROJECT_ROOT/security/certs/dev-key.pem" \
        -out "$PROJECT_ROOT/security/certs/dev-cert.pem" -days 365 -nodes \
        -subj "/C=US/ST=CA/L=San Francisco/O=NotebookMLX/CN=localhost"
    chmod 600 "$PROJECT_ROOT/security/certs/dev-key.pem"
    chmod 644 "$PROJECT_ROOT/security/certs/dev-cert.pem"
    echo "✅ Development certificates generated"
else
    echo "✅ Development certificates already exist"
fi

# Create security policy files
echo "📝 Creating security policies..."

cat > "$PROJECT_ROOT/security/policies/content-security-policy.json" << 'EOF'
{
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'"],
  "connect-src": ["'self'", "http://localhost:8000", "ws://localhost:*"],
  "media-src": ["'self'", "blob:"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": true
}
EOF

cat > "$PROJECT_ROOT/security/policies/cors-policy.json" << 'EOF'
{
  "production": {
    "allowed_origins": ["app://.", "null"],
    "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allowed_headers": ["Content-Type", "Authorization", "X-Request-ID"],
    "allow_credentials": true,
    "max_age": 86400
  },
  "development": {
    "allowed_origins": ["http://localhost:3000", "http://127.0.0.1:3000", "app://.", "null"],
    "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allowed_headers": ["Content-Type", "Authorization", "X-Request-ID"],
    "allow_credentials": true,
    "max_age": 86400
  }
}
EOF

cat > "$PROJECT_ROOT/security/policies/file-upload-policy.json" << 'EOF'
{
  "max_file_size_mb": 200,
  "max_chunk_size_mb": 16,
  "max_total_size_mb": 400,
  "allowed_extensions": [".pdf", ".txt", ".md"],
  "allowed_mime_types": [
    "application/pdf",
    "text/plain",
    "text/markdown"
  ],
  "scan_for_malware": true,
  "quarantine_suspicious": true
}
EOF

# Create environment template with security settings
echo "🔧 Creating secure environment template..."
cat > "$PROJECT_ROOT/.env.production.template" << 'EOF'
# NotebookMLX Production Environment Configuration
# Copy this file to .env and configure with your values

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
BACKEND_DATA_DIR=/opt/notebookmlx/data

# Security Settings
ALLOWED_ORIGINS=app://.,null
ALLOW_CREDENTIALS=true
CORS_MAX_AGE=86400

# File Upload Limits
BACKEND_MAX_UPLOAD_MB=200
BACKEND_MAX_CHUNK_MB=16
BACKEND_MAX_TOTAL_MB=400

# Rate Limiting
EXPORT_RATE_LIMIT_PER_MIN=60
GEN_CONCURRENCY=2

# SSL/TLS Configuration (if using HTTPS)
SSL_CERT_PATH=/opt/notebookmlx/certs/cert.pem
SSL_KEY_PATH=/opt/notebookmlx/certs/key.pem

# Database Encryption
# DATABASE_ENCRYPTION_KEY=<generate-with-openssl-rand-base64-32>

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Monitoring
PROMETHEUS_ENABLED=true
JAEGER_ENABLED=false

# Apple Notarization (for production builds)
# APPLE_ID=your-apple-id@example.com
# APPLE_APP_SPECIFIC_PASSWORD=your-app-specific-password
# APPLE_TEAM_ID=your-team-id
# CSC_NAME=Developer ID Application: Your Name

# Windows Code Signing (for production builds)
# WIN_CSC_LINK=path-to-certificate.p12
# WIN_CSC_KEY_PASSWORD=certificate-password
EOF

# Create security audit script
echo "🔍 Creating security audit script..."
cat > "$PROJECT_ROOT/scripts/security-audit.sh" << 'EOF'
#!/bin/bash

# Security Audit Script for NotebookMLX
set -euo pipefail

echo "🔍 Running Security Audit..."

# Check file permissions
echo "Checking file permissions..."
find . -type f -name "*.py" -executable -exec echo "Executable Python file found: {}" \;
find . -type f -name "*.js" -executable -exec echo "Executable JavaScript file found: {}" \;

# Check for hardcoded secrets
echo "Scanning for potential secrets..."
grep -r -i -n "password\|secret\|key\|token" --include="*.py" --include="*.js" --include="*.ts" . | grep -v ".git" | grep -v "node_modules" || echo "No obvious secrets found"

# Check Docker security
if [ -f "docker-compose.yml" ]; then
    echo "Checking Docker configuration..."
    grep -n "privileged.*true" docker-compose.yml && echo "WARNING: Privileged containers found" || echo "No privileged containers"
    grep -n "user.*root" docker-compose.yml && echo "WARNING: Root user containers found" || echo "No root user containers"
fi

# Check for insecure HTTP
echo "Checking for insecure HTTP usage..."
grep -r -n "http://" --include="*.py" --include="*.js" --include="*.ts" . | grep -v "localhost" | grep -v "127.0.0.1" && echo "WARNING: Insecure HTTP found" || echo "No insecure HTTP usage found"

echo "Security audit completed."
EOF

chmod +x "$PROJECT_ROOT/scripts/security-audit.sh"

# Install security tools if available
echo "🛠️ Installing security tools..."
if command_exists npm; then
    echo "Installing npm security tools..."
    npm install -g audit-ci 2>/dev/null || echo "Could not install audit-ci globally"
fi

if command_exists pip; then
    echo "Installing Python security tools..."
    pip install safety bandit 2>/dev/null || echo "Could not install Python security tools"
fi

# Create backup script
echo "💾 Creating backup script..."
cat > "$PROJECT_ROOT/scripts/backup-data.sh" << 'EOF'
#!/bin/bash

# Data Backup Script for NotebookMLX
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/notebookmlx/backups}"
DATA_DIR="${BACKEND_DATA_DIR:-data}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/notebookmlx_backup_$DATE.tar.gz"

echo "🗄️ Creating backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create compressed backup
tar -czf "$BACKUP_FILE" \
    --exclude="$DATA_DIR/uploads/chunks" \
    --exclude="$DATA_DIR/*.log" \
    "$DATA_DIR"

echo "✅ Backup created: $BACKUP_FILE"

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -name "notebookmlx_backup_*.tar.gz" -mtime +7 -delete
echo "🧹 Cleaned up old backups"
EOF

chmod +x "$PROJECT_ROOT/scripts/backup-data.sh"

echo ""
echo "✅ Security setup completed!"
echo ""
echo "Next steps:"
echo "1. Copy .env.production.template to .env and configure with your values"
echo "2. Run './scripts/security-audit.sh' to check for security issues"
echo "3. Set up proper SSL certificates for production"
echo "4. Configure monitoring and alerting"
echo "5. Set up regular backups with './scripts/backup-data.sh'"
echo ""
echo "🔒 Security files created in: $PROJECT_ROOT/security/"