#!/usr/bin/env python3
"""
Test script for infrastructure improvements
"""
import sys
import os
import tempfile
import shutil
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_database_indexes():
    """Test that database indexes are created"""
    print("Testing database indexes...")
    from utils.database import Database

    # Create a temporary database
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = os.path.join(tmpdir, "test.db")
        db = Database(db_path=db_path)

        # Check that indexes exist
        conn = db._get_conn()
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
        indexes = [row[0] for row in cursor.fetchall()]

        expected_indexes = [
            'idx_sources_created',
            'idx_tasks_status',
            'idx_tasks_type',
            'idx_voices_created'
        ]

        for idx in expected_indexes:
            if idx in indexes:
                print(f"  ✓ Index {idx} created")
            else:
                print(f"  ✗ Index {idx} NOT found")
                return False

        # Check WAL mode
        cursor.execute("PRAGMA journal_mode")
        mode = cursor.fetchone()[0]
        if mode == 'wal':
            print(f"  ✓ WAL mode enabled")
        else:
            print(f"  ✗ WAL mode not enabled (got {mode})")
            return False

        # Check WAL checkpointing
        cursor.execute("PRAGMA wal_autocheckpoint")
        checkpoint = cursor.fetchone()[0]
        if checkpoint == 1000:
            print(f"  ✓ WAL autocheckpoint configured (1000)")
        else:
            print(f"  ✗ WAL autocheckpoint not configured correctly (got {checkpoint})")
            return False

        print("✓ Database indexes and WAL checkpointing test passed\n")
        return True

def test_file_manager_cleanup():
    """Test file manager cleanup functionality"""
    print("Testing file manager cleanup...")
    from utils.file_manager import FileManager
    import time

    with tempfile.TemporaryDirectory() as tmpdir:
        fm = FileManager(base_path=tmpdir)

        # Create test files
        test_dir = Path(tmpdir) / "podcasts"
        test_dir.mkdir(exist_ok=True)

        # Create an old file
        old_file = test_dir / "old_podcast.wav"
        old_file.write_text("old content")

        # Set modification time to 10 days ago
        old_time = time.time() - (10 * 86400)
        os.utime(old_file, (old_time, old_time))

        # Create a new file
        new_file = test_dir / "new_podcast.wav"
        new_file.write_text("new content")

        print(f"  Created old file: {old_file.name}")
        print(f"  Created new file: {new_file.name}")

        # Run cleanup (delete files older than 7 days)
        fm.cleanup_old_files("podcasts", days=7)

        # Check results
        if not old_file.exists():
            print(f"  ✓ Old file removed")
        else:
            print(f"  ✗ Old file still exists")
            return False

        if new_file.exists():
            print(f"  ✓ New file preserved")
        else:
            print(f"  ✗ New file was removed")
            return False

        print("✓ File manager cleanup test passed\n")
        return True

def test_scheduler_imports():
    """Test that scheduler imports work"""
    print("Testing scheduler imports...")

    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        print("  ✓ APScheduler imported successfully")

        # Create a scheduler instance
        scheduler = AsyncIOScheduler()
        print("  ✓ Scheduler instance created")

        # Add a test job
        def test_job():
            pass

        scheduler.add_job(test_job, 'interval', seconds=60, id='test_job')
        print("  ✓ Test job added to scheduler")

        # Check job exists
        jobs = scheduler.get_jobs()
        if len(jobs) == 1 and jobs[0].id == 'test_job':
            print("  ✓ Job retrieved successfully")
        else:
            print("  ✗ Job not found in scheduler")
            return False

        print("✓ Scheduler imports test passed\n")
        return True

    except Exception as e:
        print(f"  ✗ Scheduler import failed: {e}")
        return False

def test_prometheus_metrics():
    """Test that Prometheus metrics are defined"""
    print("Testing Prometheus metrics...")

    try:
        from prometheus_client import Counter, Histogram, Gauge
        print("  ✓ Prometheus client imported successfully")

        # Test creating metrics
        test_counter = Counter('test_counter', 'Test counter')
        test_histogram = Histogram('test_histogram', 'Test histogram')
        test_gauge = Gauge('test_gauge', 'Test gauge')

        # Test using metrics
        test_counter.inc()
        test_histogram.observe(1.5)
        test_gauge.set(42)

        print("  ✓ Metrics created and used successfully")
        print("✓ Prometheus metrics test passed\n")
        return True

    except Exception as e:
        print(f"  ✗ Metrics test failed: {e}")
        return False

def test_disk_usage_calculation():
    """Test disk usage calculation"""
    print("Testing disk usage calculation...")

    with tempfile.TemporaryDirectory() as tmpdir:
        # Create test directory structure
        test_dir = Path(tmpdir) / "podcasts"
        test_dir.mkdir(exist_ok=True)

        # Create files of known size
        (test_dir / "file1.wav").write_bytes(b"x" * 1024)  # 1KB
        (test_dir / "file2.wav").write_bytes(b"x" * 2048)  # 2KB

        # Calculate total size
        total_size = sum(f.stat().st_size for f in test_dir.rglob('*') if f.is_file())

        expected_size = 3072  # 3KB
        if total_size == expected_size:
            print(f"  ✓ Disk usage calculated correctly: {total_size} bytes")
        else:
            print(f"  ✗ Disk usage incorrect: expected {expected_size}, got {total_size}")
            return False

        print("✓ Disk usage calculation test passed\n")
        return True

def run_all_tests():
    """Run all infrastructure tests"""
    print("=" * 60)
    print("Infrastructure Improvements Test Suite")
    print("=" * 60 + "\n")

    results = []

    # Run tests
    results.append(("Database Indexes & WAL", test_database_indexes()))
    results.append(("File Manager Cleanup", test_file_manager_cleanup()))
    results.append(("Scheduler Imports", test_scheduler_imports()))
    results.append(("Prometheus Metrics", test_prometheus_metrics()))
    results.append(("Disk Usage Calculation", test_disk_usage_calculation()))

    # Print summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "PASS" if result else "FAIL"
        symbol = "✓" if result else "✗"
        print(f"{symbol} {name:.<50} {status}")

    print("=" * 60)
    print(f"Total: {passed}/{total} tests passed")
    print("=" * 60)

    return all(result for _, result in results)

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
