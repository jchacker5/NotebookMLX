import io
import os
import tempfile
from fastapi.testclient import TestClient


def setup_temp_env(app_module):
    tmpdir = tempfile.mkdtemp()
    # Reassign DB and file manager to use temp dir
    app_module.db = app_module.Database(db_path=os.path.join(tmpdir, 'test.db'))
    app_module.file_manager = app_module.FileManager(base_path=tmpdir)
    return tmpdir


def test_health_and_metrics():
    os.environ.setdefault('DISABLE_ML_IMPORTS', '1')
    from main import app  # import here to avoid side effects
    client = TestClient(app)
    r = client.get('/healthz')
    assert r.status_code == 200 and r.json().get('status') == 'ok'
    m = client.get('/metrics')
    assert m.status_code == 200
    assert 'text/plain' in m.headers.get('content-type', '')


def test_download_validation():
    os.environ.setdefault('DISABLE_ML_IMPORTS', '1')
    from main import app
    client = TestClient(app)
    # invalid type
    r = client.get('/api/download/etc/../../passwd')
    assert r.status_code in (400, 404)
    # invalid id
    r = client.get('/api/download/uploads/../../secret')
    assert r.status_code == 400


def test_text_upload_and_chat_contract():
    os.environ.setdefault('DISABLE_ML_IMPORTS', '1')
    import main as app_module
    tmpdir = setup_temp_env(app_module)
    client = TestClient(app_module.app)

    files = {'file': ('sample.txt', b'hello world', 'text/plain')}
    up = client.post('/api/upload-source', files=files)
    assert up.status_code == 200
    data = up.json()
    assert data['status'] == 'processed'
    sid = data['source_id']

    chat = client.post('/api/chat', json={'message': 'Hi?', 'source_ids': [sid]})
    assert chat.status_code == 200
    payload = chat.json()
    assert 'response' in payload
    assert isinstance(payload.get('citations'), list)
    if payload['citations']:
        assert 'sourceId' in payload['citations'][0]

    # verify download of uploaded file succeeds
    from pathlib import Path
    ext = Path('sample.txt').suffix
    file_id = f"{sid}{ext}"
    d = client.get(f"/api/download/uploads/{file_id}")
    assert d.status_code == 200


def test_chunked_upload_and_merge_text():
    os.environ.setdefault('DISABLE_ML_IMPORTS', '1')
    import main as app_module
    setup_temp_env(app_module)
    client = TestClient(app_module.app)

    content = b'A' * (1024 * 10)  # 10KB
    file_id = 'testfile'
    total = 2
    chunk0 = io.BytesIO(content[: len(content)//2])
    chunk1 = io.BytesIO(content[len(content)//2 :])

    r0 = client.post(
        '/api/upload-chunk',
        files={
            'file_id': (None, file_id),
            'chunk_index': (None, '0'),
            'total_chunks': (None, str(total)),
            'filename': (None, 'big.txt'),
            'chunk': ('big.part0', chunk0, 'application/octet-stream'),
        },
    )
    assert r0.status_code == 200
    r1 = client.post(
        '/api/upload-chunk',
        files={
            'file_id': (None, file_id),
            'chunk_index': (None, '1'),
            'total_chunks': (None, str(total)),
            'filename': (None, 'big.txt'),
            'chunk': ('big.part1', chunk1, 'application/octet-stream'),
        },
    )
    assert r1.status_code == 200

    mr = client.post(
        '/api/merge-chunks',
        files={'file_id': (None, file_id), 'filename': (None, 'big.txt')},
    )
    assert mr.status_code == 200
    assert mr.json()['status'] == 'processed'


def test_tts_endpoints_guarded():
    os.environ.setdefault('DISABLE_ML_IMPORTS', '1')
    from main import app
    client = TestClient(app)
    sv = client.post('/api/synthesize-voice', json={'text': 'hi', 'voice_id': 'v1'})
    assert sv.status_code == 503
    tv = client.post('/api/train-voice', files={'voice_name': (None, 'v1'), 'audio_files': ('a.wav', io.BytesIO(b'00'), 'audio/wav')})
    assert tv.status_code in (200, 503)


def test_export_chat_pdf_and_podcast_zip():
    os.environ.setdefault('DISABLE_ML_IMPORTS', '1')
    import main as app_module
    tmpdir = setup_temp_env(app_module)
    client = TestClient(app_module.app)

    # Chat PDF export
    payload = {
        'title': 'Unit Test Export',
        'messages': [
            {'role': 'user', 'content': 'Hello'},
            {'role': 'assistant', 'content': 'World'},
        ],
    }
    pdf = client.post('/api/export/chat-pdf', json=payload)
    assert pdf.status_code == 200
    assert 'application/pdf' in pdf.headers.get('content-type', '')

    # Seed a task for podcast ZIP export
    task_id = 'task_zip_1'
    app_module.db.add_task({
        'id': task_id,
        'type': 'podcast_generation',
        'status': 'completed',
        'data': {
            'transcript': [['Speaker 1', 'Hello'], ['Speaker 2', 'Hi']],
            'audio_path': None,
            'segment_times': [
                {'index': 0, 'speaker': 'Speaker 1', 'start': 0.0, 'end': 1.0},
                {'index': 1, 'speaker': 'Speaker 2', 'start': 1.0, 'end': 2.0},
            ],
        },
    })
    z = client.get(f'/api/export/podcast/{task_id}.zip')
    assert z.status_code == 200
    assert 'application/zip' in z.headers.get('content-type', '')
