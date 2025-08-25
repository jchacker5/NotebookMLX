from fastapi.testclient import TestClient
from main import app


def test_openapi_contract_contains_core_routes():
  client = TestClient(app)
  r = client.get('/openapi.json')
  assert r.status_code == 200
  paths = r.json().get('paths', {})
  for p in ['/api/upload-source', '/api/chat', '/api/generate-podcast', '/api/task/{task_id}']:
    assert p in paths

