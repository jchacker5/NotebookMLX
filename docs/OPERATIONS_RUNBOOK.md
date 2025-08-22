# NotebookMLX Operations Runbook

## Table of Contents

1. [Emergency Response](#emergency-response)
2. [Daily Operations](#daily-operations)
3. [Incident Management](#incident-management)
4. [Performance Troubleshooting](#performance-troubleshooting)
5. [Security Incidents](#security-incidents)
6. [Backup and Recovery](#backup-and-recovery)
7. [Maintenance Procedures](#maintenance-procedures)

## Emergency Response

### 🚨 Critical Service Down

**Severity:** P0 - Service completely unavailable

**Immediate Actions (< 5 minutes):**

1. **Check Service Status:**
```bash
# Check if backend is running
curl -f http://localhost:8000/healthz
echo $?  # Should return 0 if healthy

# Check process status
ps aux | grep "main.py"
pgrep -f "NotebookMLX"
```

2. **Quick Restart:**
```bash
# For desktop app users
pkill -f "NotebookMLX"
open /Applications/NotebookMLX.app

# For service deployment
sudo launchctl stop com.notebookmlx.backend
sudo launchctl start com.notebookmlx.backend
```

3. **Immediate Communication:**
```bash
# Send status to monitoring
curl -X POST http://monitoring-webhook.company.com/alert \
  -H "Content-Type: application/json" \
  -d '{"severity": "critical", "service": "notebookmlx", "status": "investigating"}'
```

**Investigation Steps (< 15 minutes):**

1. **Check Logs:**
```bash
# Application logs
tail -n 100 /opt/notebookmlx/data/app.log | grep -i error

# System logs
log show --predicate 'process == "NotebookMLX"' --last 1h

# Docker logs (if containerized)
docker logs notebookmlx-backend --tail=100
```

2. **Resource Check:**
```bash
# Memory usage
ps aux --sort=-%mem | head -5

# Disk space
df -h /opt/notebookmlx/data

# CPU usage
top -l 1 | grep "CPU usage"
```

3. **Network Connectivity:**
```bash
# Port availability
lsof -i :8000
nc -zv localhost 8000

# DNS resolution (if applicable)
nslookup api.notebookmlx.com
```

### 🔥 High Error Rate

**Severity:** P1 - Service degraded but functional

**Detection:**
- Error rate > 10% for 5+ minutes
- Response time > 5 seconds for 95th percentile
- Multiple user reports

**Response Actions:**

1. **Immediate Mitigation:**
```bash
# Reduce concurrency to prevent overload
export GEN_CONCURRENCY=1
kill -HUP $(pgrep -f main.py)  # Reload config

# Check rate limiting
curl -I http://localhost:8000/healthz
# Look for 429 status codes
```

2. **Identify Root Cause:**
```bash
# Check error patterns
grep -E "ERROR|CRITICAL" /opt/notebookmlx/data/app.log | tail -20

# Monitor resource usage
iostat -x 1 5
vm_stat 1 5

# Check MLX model status
python3 -c "
import mlx.core as mx
print('MLX available:', mx.default_device())
print('Memory usage:', mx.metal.get_active_memory() / 1024**3, 'GB')
"
```

## Daily Operations

### Morning Health Check (9:00 AM)

```bash
#!/bin/bash
# daily-health-check.sh

echo "🏥 Daily Health Check - $(date)"
echo "================================"

# 1. Service Status
if curl -f http://localhost:8000/healthz > /dev/null 2>&1; then
    echo "✅ Backend service is healthy"
else
    echo "❌ Backend service is down"
    exit 1
fi

# 2. Resource Usage
echo "📊 Resource Usage:"
echo "Memory: $(ps aux | grep main.py | awk '{sum+=$6} END {print sum/1024 " MB"}')"
echo "Disk: $(df -h /opt/notebookmlx/data | tail -1 | awk '{print $5}')"

# 3. Error Count (last 24h)
ERROR_COUNT=$(grep -c "ERROR\|CRITICAL" /opt/notebookmlx/data/app.log 2>/dev/null || echo "0")
echo "Errors (24h): $ERROR_COUNT"

# 4. Active Users
ACTIVE_SESSIONS=$(grep -c "user_session" /opt/notebookmlx/data/app.log 2>/dev/null || echo "0")
echo "Active sessions: $ACTIVE_SESSIONS"

# 5. MLX Model Status
python3 -c "
try:
    import mlx.core as mx
    print('✅ MLX models available')
except Exception as e:
    print('❌ MLX models error:', e)
"

echo "Health check completed."
```

### Log Rotation and Cleanup

```bash
#!/bin/bash
# daily-cleanup.sh

echo "🧹 Daily Cleanup - $(date)"

# Rotate logs if > 100MB
LOG_FILE="/opt/notebookmlx/data/app.log"
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE") -gt 104857600 ]; then
    mv "$LOG_FILE" "${LOG_FILE}.$(date +%Y%m%d)"
    touch "$LOG_FILE"
    echo "Log rotated"
fi

# Clean old uploads (> 7 days)
find /opt/notebookmlx/data/uploads -type f -mtime +7 -delete
echo "Cleaned old uploads"

# Clean processed files (> 30 days)
find /opt/notebookmlx/data/processed -type f -mtime +30 -delete
echo "Cleaned old processed files"

# Clean temporary files
find /tmp -name "*notebookmlx*" -mtime +1 -delete 2>/dev/null
echo "Cleaned temporary files"
```

## Incident Management

### Incident Response Workflow

1. **Detection:** Automated alerts or user reports
2. **Assessment:** Determine severity and impact
3. **Response:** Execute appropriate runbook
4. **Communication:** Update stakeholders
5. **Resolution:** Fix root cause
6. **Post-mortem:** Document lessons learned

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P0 | Critical - Service down | < 15 min | Complete outage, data loss |
| P1 | High - Service degraded | < 1 hour | High error rate, slow response |
| P2 | Medium - Partial impact | < 4 hours | Some features broken |
| P3 | Low - Minor issues | < 24 hours | UI glitches, minor bugs |

### Communication Templates

**Initial Alert:**
```
🚨 INCIDENT: NotebookMLX [P0/P1/P2/P3]
Time: [timestamp]
Impact: [brief description]
Status: Investigating
ETA: [estimated resolution time]
Updates: Every 30 minutes
```

**Update:**
```
🔄 UPDATE: NotebookMLX Incident
Time: [timestamp]
Progress: [what's been done]
Next Steps: [what's happening next]
ETA: [updated estimate]
```

**Resolution:**
```
✅ RESOLVED: NotebookMLX Incident
Time: [timestamp]
Duration: [total time]
Root Cause: [brief explanation]
Follow-up: [any required actions]
```

## Performance Troubleshooting

### Slow Response Times

**Symptoms:**
- API responses > 5 seconds
- UI feels sluggish
- Timeout errors

**Diagnosis:**

1. **Check Application Metrics:**
```bash
# Response time percentiles
curl -s http://localhost:8000/metrics | grep http_request_duration_seconds

# Request volume
curl -s http://localhost:8000/metrics | grep http_requests_total
```

2. **System Resources:**
```bash
# CPU usage per process
top -pid $(pgrep -f main.py) -l 5

# Memory pressure
memory_pressure

# I/O statistics
iostat -x 1 5
```

3. **MLX Performance:**
```bash
# Check GPU utilization
python3 -c "
import mlx.core as mx
print('Device:', mx.default_device())
print('Memory usage:', mx.metal.get_active_memory() / 1024**3, 'GB')
print('Peak memory:', mx.metal.get_peak_memory() / 1024**3, 'GB')
"
```

**Resolution Actions:**

1. **Immediate:**
```bash
# Reduce concurrency
export GEN_CONCURRENCY=1

# Clear cache
rm -rf /opt/notebookmlx/data/processed/cache/*

# Restart backend
sudo launchctl stop com.notebookmlx.backend
sudo launchctl start com.notebookmlx.backend
```

2. **Long-term:**
```bash
# Optimize model configuration
# Edit backend configuration to use smaller models
# Enable model caching
# Implement request queuing
```

### High Memory Usage

**Symptoms:**
- Memory usage > 80%
- Frequent garbage collection
- Out of memory errors

**Investigation:**
```bash
# Memory breakdown
vmmap $(pgrep -f main.py) | grep -E "MALLOC|TOTAL"

# Python memory profiling
python3 -c "
import psutil
import os
p = psutil.Process(os.getpid())
print('Memory usage:', p.memory_info().rss / 1024**2, 'MB')
print('Memory percent:', p.memory_percent())
"
```

**Mitigation:**
```bash
# Force garbage collection
kill -USR1 $(pgrep -f main.py)

# Reduce model cache size
export MLX_MODEL_CACHE_SIZE=2GB

# Enable memory monitoring
export PYTHONMALLOC=debug
```

## Security Incidents

### Suspected Malware Upload

**Detection:**
- Unusual file upload patterns
- Antivirus alerts
- Suspicious file extensions

**Immediate Response:**

1. **Quarantine:**
```bash
# Stop processing new uploads
touch /opt/notebookmlx/data/.maintenance_mode

# Move suspicious files
mkdir -p /opt/notebookmlx/quarantine
mv /opt/notebookmlx/data/uploads/[suspicious-file] /opt/notebookmlx/quarantine/
```

2. **Investigation:**
```bash
# Check file metadata
file /opt/notebookmlx/quarantine/[suspicious-file]
strings /opt/notebookmlx/quarantine/[suspicious-file] | head -20

# Scan with available tools
clamscan /opt/notebookmlx/quarantine/[suspicious-file]
```

3. **Log Analysis:**
```bash
# Check upload logs
grep "upload" /opt/notebookmlx/data/app.log | grep [timestamp-range]

# Check source IP
grep [suspicious-ip] /opt/notebookmlx/data/app.log
```

### Unauthorized Access Attempt

**Detection:**
- Multiple failed login attempts
- Unusual API access patterns
- Geographic anomalies

**Response:**

1. **Immediate Protection:**
```bash
# Block suspicious IP (if identifiable)
echo "block in quick from [suspicious-ip]" | sudo pfctl -f -

# Enable additional logging
export LOG_LEVEL=DEBUG
kill -HUP $(pgrep -f main.py)
```

2. **Investigation:**
```bash
# Check access patterns
grep -E "4[0-9]{2}" /opt/notebookmlx/data/app.log | tail -20

# Review authentication logs
grep "auth" /opt/notebookmlx/data/app.log
```

## Backup and Recovery

### Daily Backup Verification

```bash
#!/bin/bash
# verify-backup.sh

BACKUP_DIR="/opt/notebookmlx/backups"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.tar.gz | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backups found"
    exit 1
fi

# Check backup age
BACKUP_AGE=$((($(date +%s) - $(stat -f %m "$LATEST_BACKUP")) / 86400))
if [ $BACKUP_AGE -gt 1 ]; then
    echo "⚠️  Backup is $BACKUP_AGE days old"
fi

# Verify backup integrity
if tar -tzf "$LATEST_BACKUP" > /dev/null 2>&1; then
    echo "✅ Backup integrity verified: $(basename $LATEST_BACKUP)"
else
    echo "❌ Backup corrupted: $(basename $LATEST_BACKUP)"
    exit 1
fi

# Check backup size
BACKUP_SIZE=$(stat -f %z "$LATEST_BACKUP")
if [ $BACKUP_SIZE -lt 1048576 ]; then  # < 1MB
    echo "⚠️  Backup suspiciously small: $(($BACKUP_SIZE / 1024)) KB"
fi
```

### Emergency Recovery

**Data Loss Scenario:**

1. **Stop Service:**
```bash
sudo launchctl stop com.notebookmlx.backend
```

2. **Restore from Backup:**
```bash
# Find latest backup
LATEST_BACKUP=$(ls -t /opt/notebookmlx/backups/*.tar.gz | head -1)

# Restore data
cd /
sudo tar -xzf "$LATEST_BACKUP"

# Fix permissions
sudo chown -R notebookmlx:notebookmlx /opt/notebookmlx/data
```

3. **Verify Recovery:**
```bash
# Check database integrity
sqlite3 /opt/notebookmlx/data/notebookmlx.db "PRAGMA integrity_check;"

# Verify file counts
echo "Sources: $(sqlite3 /opt/notebookmlx/data/notebookmlx.db "SELECT COUNT(*) FROM sources;")"
```

4. **Restart Service:**
```bash
sudo launchctl start com.notebookmlx.backend
curl -f http://localhost:8000/healthz
```

## Maintenance Procedures

### Weekly Maintenance (Sunday 2:00 AM)

```bash
#!/bin/bash
# weekly-maintenance.sh

echo "🔧 Weekly Maintenance - $(date)"

# 1. Update system packages (macOS)
sudo softwareupdate -i -a --restart

# 2. Clean Docker (if used)
docker system prune -f

# 3. Vacuum SQLite database
sqlite3 /opt/notebookmlx/data/notebookmlx.db "VACUUM;"

# 4. Update MLX models (if needed)
# pip install --upgrade mlx-lm mlx-audio f5-tts-mlx

# 5. Security scan
./scripts/security-audit.sh

# 6. Performance baseline
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8000/healthz"

echo "Weekly maintenance completed."
```

### Monthly Security Review

```bash
#!/bin/bash
# monthly-security-review.sh

echo "🔒 Monthly Security Review - $(date)"

# 1. Check for security updates
brew outdated

# 2. Review access logs
echo "Top IPs by request count:"
grep -o '"[0-9.]*"' /opt/notebookmlx/data/app.log | sort | uniq -c | sort -nr | head -10

# 3. Check file permissions
find /opt/notebookmlx -type f -perm +o+w -exec ls -la {} \;

# 4. Review uploaded files
echo "Recent uploads:"
find /opt/notebookmlx/data/uploads -type f -mtime -30 -exec ls -la {} \;

# 5. Certificate expiry check
if [ -f "/opt/notebookmlx/certs/cert.pem" ]; then
    openssl x509 -enddate -noout -in /opt/notebookmlx/certs/cert.pem
fi

echo "Security review completed."
```

### Quarterly Disaster Recovery Test

```bash
#!/bin/bash
# quarterly-dr-test.sh

echo "🚨 Disaster Recovery Test - $(date)"

# 1. Create test backup
./scripts/backup-data.sh

# 2. Simulate data loss (on test instance)
sudo rm -rf /opt/notebookmlx/test-data/*

# 3. Test recovery procedure
# [Execute recovery steps]

# 4. Verify recovery
# [Run verification checks]

# 5. Document results
echo "DR test results:" > dr-test-$(date +%Y%m%d).txt
echo "Recovery time: [duration]" >> dr-test-$(date +%Y%m%d).txt
echo "Data integrity: [status]" >> dr-test-$(date +%Y%m%d).txt

echo "DR test completed."
```

## Contact Information

### Escalation Matrix

| Issue Type | Primary Contact | Secondary Contact | Response Time |
|------------|----------------|-------------------|---------------|
| P0 Critical | On-call Engineer | Engineering Manager | 15 minutes |
| P1 High | Engineering Team | Product Manager | 1 hour |
| Security | Security Team | CTO | 30 minutes |
| Data Loss | Backup Admin | Infrastructure Team | 1 hour |

### Emergency Contacts

- **On-call Engineer:** +1-XXX-XXX-XXXX
- **Engineering Manager:** +1-XXX-XXX-XXXX
- **Security Team:** security@company.com
- **Infrastructure Team:** infra@company.com

---

**Last Updated:** $(date)  
**Version:** 1.0  
**Review Date:** Quarterly