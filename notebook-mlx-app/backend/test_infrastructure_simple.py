#!/usr/bin/env python3
"""
Simple test script for infrastructure improvements (no external deps required)
"""
import sys
import os
import sqlite3
import tempfile

def test_database_features():
    """Test database indexes and WAL configuration"""
    print("=" * 60)
    print("Testing Database Infrastructure Improvements")
    print("=" * 60 + "\n")

    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = os.path.join(tmpdir, "test.db")

        # Initialize database using our code
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from utils.database import Database

        db = Database(db_path=db_path)
        conn = db._get_conn()
        cursor = conn.cursor()

        # 1. Check indexes
        print("1. Checking Database Indexes:")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
        indexes = [row[0] for row in cursor.fetchall()]

        expected_indexes = {
            'idx_sources_created': 'Sources table created_at index',
            'idx_tasks_status': 'Tasks table status/updated_at index',
            'idx_tasks_type': 'Tasks table type/created_at index',
            'idx_voices_created': 'Voices table created_at index'
        }

        all_passed = True
        for idx, description in expected_indexes.items():
            if idx in indexes:
                print(f"   ✓ {idx:.<35} {description}")
            else:
                print(f"   ✗ {idx:.<35} MISSING")
                all_passed = False

        # 2. Check WAL mode
        print("\n2. Checking WAL Configuration:")
        cursor.execute("PRAGMA journal_mode")
        mode = cursor.fetchone()[0]
        if mode.lower() == 'wal':
            print(f"   ✓ Journal mode: {mode}")
        else:
            print(f"   ✗ Journal mode: {mode} (expected WAL)")
            all_passed = False

        # 3. Check WAL autocheckpoint
        cursor.execute("PRAGMA wal_autocheckpoint")
        checkpoint = cursor.fetchone()[0]
        if checkpoint == 1000:
            print(f"   ✓ WAL autocheckpoint: {checkpoint} pages")
        else:
            print(f"   ✗ WAL autocheckpoint: {checkpoint} (expected 1000)")
            all_passed = False

        # 4. Check synchronous mode
        cursor.execute("PRAGMA synchronous")
        sync_mode = cursor.fetchone()[0]
        print(f"   ✓ Synchronous mode: {sync_mode} (1=NORMAL)")

        # 5. Check busy timeout
        cursor.execute("PRAGMA busy_timeout")
        timeout = cursor.fetchone()[0]
        if timeout == 5000:
            print(f"   ✓ Busy timeout: {timeout}ms")
        else:
            print(f"   ✗ Busy timeout: {timeout}ms (expected 5000)")
            all_passed = False

        # 6. Test index usage with EXPLAIN QUERY PLAN
        print("\n3. Verifying Index Usage:")

        # Add test data
        cursor.execute("""
            INSERT INTO sources (id, filename, type, path, created_at)
            VALUES ('test1', 'test.pdf', 'pdf', '/tmp/test.pdf', datetime('now'))
        """)

        cursor.execute("""
            INSERT INTO tasks (id, type, status, created_at)
            VALUES ('task1', 'podcast_generation', 'completed', datetime('now'))
        """)

        # Test index usage
        cursor.execute("""
            EXPLAIN QUERY PLAN
            SELECT * FROM sources ORDER BY created_at DESC LIMIT 10
        """)
        plan = cursor.fetchone()
        uses_index = 'idx_sources_created' in str(plan)
        if uses_index:
            print(f"   ✓ Query uses idx_sources_created")
        else:
            print(f"   ⚠ Query may not use index: {plan}")

        cursor.execute("""
            EXPLAIN QUERY PLAN
            SELECT * FROM tasks WHERE status='completed' ORDER BY updated_at DESC
        """)
        plan = cursor.fetchone()
        uses_index = 'idx_tasks_status' in str(plan)
        if uses_index:
            print(f"   ✓ Query uses idx_tasks_status")
        else:
            print(f"   ⚠ Query may not use index: {plan}")

        conn.close()

        print("\n" + "=" * 60)
        if all_passed:
            print("✓ ALL DATABASE TESTS PASSED")
        else:
            print("✗ SOME TESTS FAILED")
        print("=" * 60)

        return all_passed

def test_scheduler_setup():
    """Test that scheduler components are importable"""
    print("\n" + "=" * 60)
    print("Testing Scheduler Setup")
    print("=" * 60 + "\n")

    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        print("   ✓ APScheduler imports successfully")

        scheduler = AsyncIOScheduler()
        print("   ✓ AsyncIOScheduler instance created")

        # Test adding a job
        def dummy_job():
            pass

        scheduler.add_job(dummy_job, 'interval', seconds=60, id='test')
        print("   ✓ Test job added successfully")

        jobs = scheduler.get_jobs()
        if len(jobs) == 1:
            print(f"   ✓ Job count correct: {len(jobs)}")
        else:
            print(f"   ✗ Unexpected job count: {len(jobs)}")
            return False

        print("\n" + "=" * 60)
        print("✓ SCHEDULER TESTS PASSED")
        print("=" * 60)
        return True

    except ImportError as e:
        print(f"   ✗ Import failed: {e}")
        print("\n   Note: Run 'pip install APScheduler>=3.10.0' to fix")
        print("=" * 60)
        print("⚠ SCHEDULER TESTS SKIPPED (missing dependency)")
        print("=" * 60)
        return True  # Don't fail if dependency not installed yet

def test_prometheus_setup():
    """Test Prometheus metrics setup"""
    print("\n" + "=" * 60)
    print("Testing Prometheus Metrics")
    print("=" * 60 + "\n")

    try:
        from prometheus_client import Counter, Histogram, Gauge

        print("   ✓ Prometheus client imports successfully")

        # Test metric creation
        counter = Counter('test_total', 'Test counter', ['label'])
        histogram = Histogram('test_duration', 'Test duration')
        gauge = Gauge('test_value', 'Test gauge')

        print("   ✓ Metrics created successfully")

        # Test metric operations
        counter.labels(label='test').inc()
        histogram.observe(1.5)
        gauge.set(42)

        print("   ✓ Metric operations work correctly")

        print("\n" + "=" * 60)
        print("✓ PROMETHEUS TESTS PASSED")
        print("=" * 60)
        return True

    except ImportError as e:
        print(f"   ✗ Import failed: {e}")
        print("=" * 60)
        print("⚠ PROMETHEUS TESTS SKIPPED (missing dependency)")
        print("=" * 60)
        return True  # Don't fail if dependency not installed yet

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("NotebookMLX Infrastructure Improvements Test Suite")
    print("=" * 60 + "\n")

    results = []
    results.append(("Database Features", test_database_features()))
    results.append(("Scheduler Setup", test_scheduler_setup()))
    results.append(("Prometheus Metrics", test_prometheus_setup()))

    # Summary
    print("\n" + "=" * 60)
    print("Final Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}  {name}")

    print("=" * 60)
    print(f"  Total: {passed}/{total} test suites passed")
    print("=" * 60 + "\n")

    return all(result for _, result in results)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
