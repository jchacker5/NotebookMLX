import os
from fastapi.testclient import TestClient

# Disable heavy ML imports in CI/unit tests
os.environ.setdefault("DISABLE_ML_IMPORTS", "1")

from main import app


client = TestClient(app)


def test_root_health():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json().get("message") == "NotebookMLX API is running"
