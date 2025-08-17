import sys
import os
import subprocess

# Add backend to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

# Set up environment
os.environ['PYTHONPATH'] = backend_dir + os.pathsep + os.environ.get('PYTHONPATH', '')

# Launch backend
python_exe = os.path.join(os.path.dirname(__file__), 'venv', 'bin', 'python')
if not os.path.exists(python_exe):
    python_exe = os.path.join(os.path.dirname(__file__), 'venv', 'Scripts', 'python.exe')

main_py = os.path.join(backend_dir, 'main.py')
subprocess.run([python_exe, main_py] + sys.argv[1:])
