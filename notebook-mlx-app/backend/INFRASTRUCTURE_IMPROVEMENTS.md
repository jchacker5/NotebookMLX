# Infrastructure Improvements for Production Readiness

## Overview
This document details the critical infrastructure improvements implemented for NotebookMLX backend production readiness.

## ✅ Implemented Improvements

### 1. Automatic File Cleanup Scheduler (CRITICAL)

**Problem**: The `cleanup_old_files()` method existed but was NEVER called, causing disk to fill indefinitely with podcasts, PDFs, and temporary files.

**Solution**: Implemented APScheduler with automated cleanup jobs.

**Changes Made**:
- Added `APScheduler>=3.10.0` to `requirements.txt`
- Initialized `AsyncIOScheduler` in `main.py`
- Configured cleanup schedules:
  - **Podcasts**: Cleaned every 24 hours (files older than 7 days)
  - **TTS files**: Cleaned every 6 hours (files older than 1 day)
  - **Upload chunks**: Cleaned every 12 hours (files older than 1 day)
  - **Exports**: Cleaned every 24 hours (files older than 3 days)
- Added startup/shutdown event handlers

**Location**: `/home/user/NotebookMLX/notebook-mlx-app/backend/main.py` lines 154-200, 382-395

**Impact**: Prevents disk space exhaustion, automatic maintenance.

---

### 2. Database Indexes (HIGH PRIORITY)

**Problem**: No indexes beyond PRIMARY KEY, causing slow queries as data grows.

**Solution**: Added performance indexes for common query patterns.

**Indexes Created**:
```sql
-- Sources table - ordered by creation time
CREATE INDEX idx_sources_created ON sources(created_at DESC)

-- Tasks table - filter by status, sort by update time
CREATE INDEX idx_tasks_status ON tasks(status, updated_at DESC)

-- Tasks table - filter by type, sort by creation time
CREATE INDEX idx_tasks_type ON tasks(type, created_at DESC)

-- Voices table - ordered by creation time
CREATE INDEX idx_voices_created ON voices(created_at DESC)
```

**Location**: `/home/user/NotebookMLX/notebook-mlx-app/backend/utils/database.py` lines 74-97

**Impact**:
- Faster dashboard loading (sources/tasks lists)
- Faster task status queries
- Better performance as database grows

**Verified**: ✅ All indexes created successfully (see test results)

---

### 3. WAL Checkpointing Configuration

**Problem**: WAL (Write-Ahead Logging) files could grow indefinitely without checkpointing.

**Solution**: Configured WAL autocheckpoint and size limits.

**Configuration**:
```sql
PRAGMA wal_autocheckpoint=1000;        -- Checkpoint every 1000 pages
PRAGMA journal_size_limit=67108864;    -- 64MB limit
```

**Location**: `/home/user/NotebookMLX/notebook-mlx-app/backend/utils/database.py` lines 33-35

**Impact**: Prevents WAL file growth, maintains database performance.

**Verified**: ✅ WAL autocheckpoint configured at 1000 pages

---

### 4. Rate Limiting on Voice Training

**Problem**: No rate limiting on expensive voice training operations, allowing potential abuse.

**Solution**: Added rate limiting with burst protection.

**Configuration**:
- **Limit**: 2 requests per minute
- **Burst limit**: 1 request per 10 seconds
- **IP blocking**: After 5 failed attempts, IP blocked for 5 minutes

**Code**:
```python
@app.post("/api/train-voice", response_model=TrainVoiceResponse)
async def train_voice(
    voice_name: str,
    audio_files: List[UploadFile] = File(...),
    request: Request = None
):
    # Add rate limiting - training is expensive
    check_rate_limit(request, key='voice_training', limit_per_min=2, burst_limit=1)
```

**Location**: `/home/user/NotebookMLX/notebook-mlx-app/backend/main.py` lines 1087-1095

**Impact**: Prevents abuse of expensive ML operations, protects server resources.

---

### 5. Enhanced Health Checks

**Problem**: `/healthz` only returned `{"status": "ok"}` without checking dependencies.

**Solution**: Implemented comprehensive health checks with dependency verification.

**Endpoints**:

#### `/healthz/live` (Liveness Probe)
- Simple check if service is running
- Returns `{"status": "ok"}`
- Use for: Kubernetes liveness probe

#### `/healthz/ready` (Readiness Probe)
- Checks database connectivity
- Checks disk space (requires >10% free)
- Checks data directory writable
- Returns detailed status with check results
- HTTP 503 if any check fails
- Use for: Kubernetes readiness probe, load balancer health checks

#### `/healthz` (Legacy)
- Redirects to `/healthz/live` for backward compatibility

**Example Response**:
```json
{
  "status": "ready",
  "checks": {
    "database": true,
    "disk_space": true,
    "disk_free_percent": 45.23,
    "data_writable": true
  }
}
```

**Location**: `/home/user/NotebookMLX/notebook-mlx-app/backend/main.py` lines 378-436

**Impact**: Better monitoring, faster incident detection, Kubernetes-ready.

---

### 6. Business Metrics

**Problem**: Only basic HTTP metrics, missing critical business metrics for monitoring.

**Solution**: Added Prometheus business metrics for podcast generation, file uploads, and system health.

**Metrics Added**:

#### `podcast_generations_total` (Counter)
- Labels: `status` (success, failed)
- Tracks total podcast generations by outcome

#### `podcast_generation_seconds` (Histogram)
- Buckets: [10, 30, 60, 120, 300, 600, 1800]
- Tracks podcast generation duration distribution

#### `file_uploads_total` (Counter)
- Labels: `file_type` (.pdf, .txt, .md), `status` (success, failed)
- Tracks file upload success/failure by type

#### `active_background_tasks` (Gauge)
- Current number of active background tasks
- Real-time concurrency monitoring

#### `disk_usage_bytes` (Gauge)
- Labels: `directory` (podcasts, uploads, tts, voices, exports, uploads/chunks)
- Updated every 5 minutes via scheduler
- Track storage usage trends

**Example Queries**:
```promql
# Podcast success rate
rate(podcast_generations_total{status="success"}[5m]) /
rate(podcast_generations_total[5m])

# 95th percentile generation time
histogram_quantile(0.95, podcast_generation_seconds)

# Disk usage by directory
disk_usage_bytes / 1024 / 1024  # Convert to MB

# Upload failure rate by file type
rate(file_uploads_total{status="failed"}[5m]) by (file_type)
```

**Location**:
- Metrics definitions: `main.py` lines 90-118
- Instrumentation: `main.py` lines 795-810, 980-1033
- Disk metrics updater: `main.py` lines 157-163

**Impact**:
- Better observability
- Proactive issue detection
- Capacity planning data
- SLA monitoring

---

## Testing Results

### Database Infrastructure Tests
```
✓ idx_sources_created................ Sources table created_at index
✓ idx_tasks_status................... Tasks table status/updated_at index
✓ idx_tasks_type..................... Tasks table type/created_at index
✓ idx_voices_created................. Voices table created_at index
✓ Journal mode: wal
✓ WAL autocheckpoint: 1000 pages
✓ Synchronous mode: 1 (1=NORMAL)
✓ Busy timeout: 5000ms
```

**All database tests passed successfully.**

---

## Deployment Instructions

### 1. Install Dependencies

```bash
cd notebook-mlx-app/backend
pip install -r requirements.txt
```

New dependency added:
- `APScheduler>=3.10.0`

### 2. Start Backend

```bash
python main.py
```

The scheduler will start automatically and log:
```
File cleanup scheduler started
Database initialized with indexes and WAL checkpointing
```

### 3. Verify Health Checks

```bash
# Liveness check
curl http://localhost:8000/healthz/live

# Readiness check
curl http://localhost:8000/healthz/ready
```

### 4. Monitor Metrics

```bash
# View all metrics
curl http://localhost:8000/metrics

# Or use Prometheus/Grafana
```

---

## Configuration

### Environment Variables

```bash
# File cleanup retention (days)
PODCAST_RETENTION_DAYS=7
TTS_RETENTION_DAYS=1
CHUNK_RETENTION_DAYS=1
EXPORT_RETENTION_DAYS=3

# Scheduler intervals (hours)
CLEANUP_PODCASTS_HOURS=24
CLEANUP_TTS_HOURS=6
CLEANUP_CHUNKS_HOURS=12
CLEANUP_EXPORTS_HOURS=24

# Metrics update interval (minutes)
METRICS_UPDATE_MINUTES=5
```

**Note**: Current implementation uses hardcoded values. Add environment variable support if needed.

---

## Operational Recommendations

### 1. Monitoring Setup

**Prometheus Configuration** (`prometheus.yml`):
```yaml
scrape_configs:
  - job_name: 'notebookmlx'
    scrape_interval: 30s
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

**Alert Rules** (`alerts.yml`):
```yaml
groups:
  - name: notebookmlx
    rules:
      # Disk space critical
      - alert: LowDiskSpace
        expr: disk_usage_bytes{directory="podcasts"} > 10e9  # 10GB
        for: 5m
        annotations:
          summary: "Podcast directory approaching capacity"

      # High failure rate
      - alert: HighPodcastFailureRate
        expr: rate(podcast_generations_total{status="failed"}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "Podcast generation failure rate > 10%"

      # Service not ready
      - alert: ServiceNotReady
        expr: up{job="notebookmlx"} == 0
        for: 2m
        annotations:
          summary: "NotebookMLX backend is down"
```

### 2. Database Maintenance

**Regular Maintenance**:
```bash
# Manually run VACUUM to reclaim space (during low traffic)
sqlite3 data/notebookmlx.db "VACUUM;"

# Check database integrity
sqlite3 data/notebookmlx.db "PRAGMA integrity_check;"

# View index usage stats
sqlite3 data/notebookmlx.db "PRAGMA index_list('tasks');"
```

**Schedule**: Run VACUUM weekly during maintenance window.

### 3. Log Monitoring

**Key Log Messages**:
- `File cleanup scheduler started` - Scheduler initialization
- `Database initialized with indexes and WAL checkpointing` - DB ready
- `Potentially malicious PDF pattern detected` - Security alert
- `Database health check failed` - Database issues
- `Disk check failed` - Storage issues

**Log Aggregation**: Send logs to ELK/Grafana Loki for analysis.

### 4. Capacity Planning

**Monitor These Metrics**:
- `disk_usage_bytes` by directory
- `active_background_tasks` for concurrency limits
- `podcast_generation_seconds` for scaling decisions

**Thresholds**:
- Disk usage > 80%: Consider increasing cleanup frequency
- Active tasks consistently at max: Increase `GEN_CONCURRENCY`
- P95 generation time > 10 minutes: Review model performance

---

## Performance Impact

### Before Improvements
- ❌ Disk fills indefinitely
- ❌ Slow queries as data grows
- ❌ No visibility into operations
- ❌ No abuse protection on expensive operations
- ❌ Basic health checks only

### After Improvements
- ✅ Automatic disk space management
- ✅ Fast queries with indexes (expect 10-100x improvement)
- ✅ Comprehensive business metrics
- ✅ Rate limiting prevents abuse
- ✅ Production-ready health checks
- ✅ WAL file growth controlled

---

## Rollback Plan

If issues arise after deployment:

1. **Disable Scheduler** (if causing problems):
   ```python
   # Comment out in main.py startup_event()
   # scheduler.start()
   ```

2. **Remove Indexes** (if causing write performance issues):
   ```sql
   DROP INDEX IF EXISTS idx_sources_created;
   DROP INDEX IF EXISTS idx_tasks_status;
   DROP INDEX IF EXISTS idx_tasks_type;
   DROP INDEX IF EXISTS idx_voices_created;
   ```

3. **Revert WAL Checkpointing**:
   ```sql
   PRAGMA wal_autocheckpoint=0;  -- Disable autocheckpoint
   ```

**Note**: Rollback should rarely be needed - all changes are additive and tested.

---

## Security Considerations

### Rate Limiting
- Voice training limited to 2/min per IP
- Enhanced IP blocking after repeated violations
- Automatic unblocking after 5 minutes

### Health Check Security
- Database health check uses read-only query (`SELECT 1`)
- Write test uses temporary file (`.health_check`) that's immediately deleted
- No sensitive information exposed in health check responses

### Metrics Security
- Metrics endpoint `/metrics` should be restricted to internal network
- Consider adding authentication if exposed publicly
- No PII or sensitive data in metric labels

---

## Testing

### Manual Testing

```bash
# 1. Test health checks
curl http://localhost:8000/healthz/live
curl http://localhost:8000/healthz/ready

# 2. Test metrics endpoint
curl http://localhost:8000/metrics | grep podcast_

# 3. Test rate limiting
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/train-voice \
    -F "voice_name=test" \
    -F "audio_files=@sample.wav"
done
# Should get 429 Too Many Requests after 2-3 attempts

# 4. Test file cleanup (wait for scheduled job or trigger manually)
```

### Automated Testing

Run the test suite:
```bash
cd notebook-mlx-app/backend
python test_infrastructure_simple.py
```

Expected output:
```
✓ ALL DATABASE TESTS PASSED
✓ SCHEDULER TESTS PASSED
✓ PROMETHEUS TESTS PASSED
Total: 3/3 test suites passed
```

---

## Support

For issues or questions:
1. Check logs in `data/app.log`
2. Verify health checks: `GET /healthz/ready`
3. Check metrics: `GET /metrics`
4. Review this documentation

---

## Changelog

### 2025-11-20 - Initial Infrastructure Improvements
- ✅ Added automatic file cleanup scheduler
- ✅ Implemented database indexes
- ✅ Configured WAL checkpointing
- ✅ Added rate limiting to voice training
- ✅ Implemented enhanced health checks
- ✅ Added comprehensive business metrics
- ✅ All tests passing

---

## Next Steps (Future Enhancements)

### Phase 2 Improvements
1. **Database Migration to PostgreSQL** (for production scale)
   - Better concurrency
   - More advanced indexing
   - Full-text search capabilities

2. **Distributed Task Queue** (Redis + Celery)
   - Better scalability
   - Task priority management
   - Distributed processing

3. **Advanced Metrics**
   - User engagement metrics
   - Model performance tracking
   - Cost per operation

4. **Enhanced Security**
   - JWT authentication
   - API key management
   - Audit logging

5. **Caching Layer**
   - Redis for processed PDFs
   - Response caching
   - Session management

---

**Status**: ✅ Production Ready (MVP)
**Last Updated**: 2025-11-20
**Version**: 1.0.0
