# Developer Tutorial: Building with NotebookMLX

This comprehensive tutorial will guide you through developing with the NotebookMLX codebase, from setting up your development environment to implementing new features and following best practices.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Architecture Overview](#architecture-overview)
3. [Frontend Development](#frontend-development)
4. [Backend Development](#backend-development)
5. [API Integration](#api-integration)
6. [Testing Strategies](#testing-strategies)
7. [Deployment and Operations](#deployment-and-operations)
8. [Contributing Guidelines](#contributing-guidelines)

## Development Environment Setup

### Prerequisites

**System Requirements:**
- macOS (Apple Silicon recommended for MLX acceleration)
- Node.js 20+ with pnpm
- Python 3.10+ with virtual environment support
- Git with SSH keys configured

**Required Tools:**
```bash
# Install Node.js and pnpm
brew install node pnpm

# Install Python and dependencies
brew install python@3.10
pip install virtualenv

# Install development tools
brew install pre-commit
npm install -g @playwright/test
```

### Initial Setup

**1. Clone and Setup Repository:**
```bash
git clone https://github.com/your-org/NotebookMLX.git
cd NotebookMLX

# Install pre-commit hooks
pre-commit install

# Setup backend
cd notebook-mlx-app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup frontend
cd ../frontend
pnpm install

# Setup main app (Electron)
cd ..
pnpm install
```

**2. Environment Configuration:**
```bash
# Backend environment
cd notebook-mlx-app/backend
cp .env.example .env

# Edit .env with your settings:
# BACKEND_HOST=localhost
# BACKEND_PORT=8000
# ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
# BACKEND_DATA_DIR=./data
# GEN_CONCURRENCY=2
```

**3. Verify Installation:**
```bash
# Test backend
cd notebook-mlx-app/backend
python -m pytest

# Test frontend
cd ../frontend
pnpm run type-check
pnpm run lint

# Run development servers
# Terminal 1: Backend
cd notebook-mlx-app/backend
uvicorn main:app --reload

# Terminal 2: Frontend
cd notebook-mlx-app/frontend
pnpm start

# Terminal 3: Electron (optional)
cd notebook-mlx-app
pnpm start
```

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Electron Shell                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │              React Frontend                     │ │
│  │  ┌─────────────┐  ┌─────────────┐ ┌──────────┐  │ │
│  │  │   Sources   │  │    Chat     │ │  Studio  │  │ │
│  │  │    Panel    │  │    Panel    │ │  Panel   │  │ │
│  │  └─────────────┘  └─────────────┘ └──────────┘  │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                           │
                      HTTP API
                           │
┌─────────────────────────────────────────────────────┐
│                FastAPI Backend                       │
│  ┌─────────────┐  ┌─────────────┐ ┌──────────────┐ │
│  │  API Routes │  │  ML Modules │ │   Database   │ │
│  │             │  │             │ │   (SQLite)   │ │
│  │ ┌─────────┐ │  │ ┌─────────┐ │ │              │ │
│  │ │ Upload  │ │  │ │ Qwen2.5 │ │ │ ┌──────────┐ │ │
│  │ │ Chat    │ │  │ │ F5-TTS  │ │ │ │ Sources  │ │ │
│  │ │ Export  │ │  │ │ Models  │ │ │ │ Tasks    │ │ │
│  │ └─────────┘ │  │ └─────────┘ │ │ │ Files    │ │ │
│  └─────────────┘  └─────────────┘ │ └──────────┘ │ │
└─────────────────────────────────────────────────────┘
```

### Key Technologies

**Frontend Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- React Query for server state
- Axios for HTTP requests

**Backend Stack:**
- FastAPI with Python 3.10+
- SQLite with WAL mode
- MLX for Apple Silicon acceleration
- Pydantic for data validation
- Uvicorn ASGI server

**Development Tools:**
- ESLint + Prettier for code quality
- Pre-commit hooks for consistency
- Playwright for E2E testing
- Pytest for backend testing

## Frontend Development

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── studio/         # Studio-specific components
│   └── [Component].tsx # Main components
├── hooks/              # Custom React hooks
├── services/           # API and external services
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # Global styles and themes
```

### Creating a New Component

**1. Define TypeScript Interface:**
```typescript
// src/types/components.ts
export interface MyComponentProps extends BaseComponentProps {
  title: string
  onAction?: (value: string) => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}
```

**2. Implement Component:**
```tsx
// src/components/MyComponent.tsx
import type { MyComponentProps } from '@/types/components'
import { cn } from '@/lib/utils'

export function MyComponent({
  title,
  onAction,
  variant = 'primary',
  disabled = false,
  className,
  testId,
  ...props
}: MyComponentProps) {
  const handleClick = () => {
    if (!disabled && onAction) {
      onAction('example-value')
    }
  }

  return (
    <div
      className={cn(
        'my-component',
        variant === 'primary' && 'bg-primary text-primary-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      data-testid={testId}
      {...props}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <button
        onClick={handleClick}
        disabled={disabled}
        className="mt-2 px-4 py-2 rounded bg-blue-500 text-white"
      >
        Action
      </button>
    </div>
  )
}
```

**3. Add Tests:**
```tsx
// src/components/__tests__/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('renders with title', () => {
    render(<MyComponent title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('calls onAction when button clicked', () => {
    const onAction = jest.fn()
    render(<MyComponent title="Test" onAction={onAction} />)
    
    fireEvent.click(screen.getByRole('button', { name: /action/i }))
    expect(onAction).toHaveBeenCalledWith('example-value')
  })

  it('respects disabled state', () => {
    const onAction = jest.fn()
    render(<MyComponent title="Test" onAction={onAction} disabled />)
    
    fireEvent.click(screen.getByRole('button', { name: /action/i }))
    expect(onAction).not.toHaveBeenCalled()
  })
})
```

### State Management Patterns

**Zustand Store Setup:**
```typescript
// src/store/useMyStore.ts
import { create } from 'zustand'

interface MyState {
  items: Item[]
  selectedId: string | null
  loading: boolean
  error: string | null
  
  // Actions
  addItem: (item: Item) => void
  selectItem: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useMyStore = create<MyState>((set, get) => ({
  items: [],
  selectedId: null,
  loading: false,
  error: null,
  
  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),
    
  selectItem: (id) =>
    set({ selectedId: id }),
    
  setLoading: (loading) =>
    set({ loading }),
    
  setError: (error) =>
    set({ error }),
}))
```

**React Query Integration:**
```typescript
// src/hooks/useItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchItems, createItem } from '@/services/api'

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createItem,
    onSuccess: (newItem) => {
      queryClient.setQueryData(['items'], (old: Item[]) => 
        [...old, newItem]
      )
    },
  })
}
```

### Styling with Tailwind

**Component Styling Pattern:**
```tsx
// Use clsx for conditional classes
import { clsx } from 'clsx'

const buttonStyles = clsx(
  // Base styles
  'px-4 py-2 rounded font-medium transition-colors',
  // Conditional styles
  variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
  variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  disabled && 'opacity-50 cursor-not-allowed',
  // Custom className
  className
)
```

**Responsive Design:**
```tsx
<div className="
  grid grid-cols-1 gap-4
  md:grid-cols-2 md:gap-6
  lg:grid-cols-3 lg:gap-8
  xl:grid-cols-4
">
  {/* Responsive grid layout */}
</div>
```

## Backend Development

### Project Structure

```
backend/
├── api/                # API route modules
│   ├── models/        # Pydantic models
│   └── routes/        # FastAPI routers
├── ml/                # Machine learning modules
│   ├── pdf_processor.py
│   ├── transcript_generator.py
│   └── tts_engine.py
├── utils/             # Utility modules
│   ├── database.py
│   └── file_manager.py
├── tests/             # Test files
├── main.py            # FastAPI application
└── requirements.txt   # Dependencies
```

### Creating a New API Endpoint

**1. Define Pydantic Models:**
```python
# api/models/my_models.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MyItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    tags: List[str] = Field(default_factory=list)

class MyItemResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    tags: List[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
```

**2. Implement Route Handler:**
```python
# api/routes/my_routes.py
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..models.my_models import MyItemCreate, MyItemResponse
from ...utils.database import get_db_session

router = APIRouter(prefix="/api/my-items", tags=["my-items"])

@router.post("/", response_model=MyItemResponse)
async def create_item(
    item_data: MyItemCreate,
    db: Session = Depends(get_db_session)
):
    """Create a new item."""
    try:
        # Validate data
        if not item_data.name.strip():
            raise HTTPException(
                status_code=400,
                detail="Name cannot be empty"
            )
        
        # Create database record
        db_item = MyItemModel(
            name=item_data.name,
            description=item_data.description,
            tags=item_data.tags
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        
        return MyItemResponse.from_orm(db_item)
        
    except Exception as e:
        logger.error(f"Failed to create item: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create item"
        )

@router.get("/", response_model=List[MyItemResponse])
async def list_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    """List all items with pagination."""
    items = db.query(MyItemModel).offset(skip).limit(limit).all()
    return [MyItemResponse.from_orm(item) for item in items]
```

**3. Add Database Model:**
```python
# utils/database.py
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class MyItemModel(Base):
    __tablename__ = "my_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**4. Register Router:**
```python
# main.py
from api.routes.my_routes import router as my_router

app = FastAPI()
app.include_router(my_router)
```

### ML Module Development

**Creating a New ML Service:**
```python
# ml/my_ml_service.py
import logging
from typing import List, Dict, Any
from pathlib import Path
import mlx.core as mx
import mlx.nn as nn

logger = logging.getLogger(__name__)

class MyMLService:
    """Custom ML service for specific tasks."""
    
    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the ML model."""
        try:
            # Load your MLX model here
            logger.info(f"Loading model from {self.model_path}")
            # self.model = mx.load(self.model_path)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def process(self, input_data: str) -> Dict[str, Any]:
        """Process input data with the model."""
        if not self.model:
            raise RuntimeError("Model not loaded")
        
        try:
            # Your ML processing logic here
            result = {
                "processed_text": input_data.upper(),  # Example
                "confidence": 0.95,
                "metadata": {
                    "model_version": "1.0",
                    "processing_time": 0.1
                }
            }
            return result
        except Exception as e:
            logger.error(f"Processing failed: {e}")
            raise

# Global service instance
ml_service = None

def get_ml_service() -> MyMLService:
    """Get or create ML service instance."""
    global ml_service
    if ml_service is None:
        ml_service = MyMLService("/path/to/model")
    return ml_service
```

### Testing Backend Code

**Unit Tests:**
```python
# tests/test_my_routes.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_item():
    """Test item creation endpoint."""
    item_data = {
        "name": "Test Item",
        "description": "Test description",
        "tags": ["test", "api"]
    }
    
    response = client.post("/api/my-items/", json=item_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == item_data["name"]
    assert data["description"] == item_data["description"]
    assert data["tags"] == item_data["tags"]
    assert "id" in data
    assert "created_at" in data

def test_list_items():
    """Test item listing endpoint."""
    response = client.get("/api/my-items/")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)

def test_create_item_validation():
    """Test validation on item creation."""
    invalid_data = {"name": ""}  # Empty name should fail
    
    response = client.post("/api/my-items/", json=invalid_data)
    assert response.status_code == 400
```

**Integration Tests:**
```python
# tests/test_integration.py
import pytest
from pathlib import Path
import tempfile
from utils.database import create_tables, get_db_session

@pytest.fixture
def temp_db():
    """Create temporary database for testing."""
    with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
        db_path = tmp.name
        create_tables(db_path)
        yield db_path

def test_full_workflow(temp_db):
    """Test complete workflow from upload to processing."""
    # Setup test client with temp database
    client = TestClient(app)
    
    # Upload a test file
    test_file = Path("tests/fixtures/test.pdf")
    with open(test_file, "rb") as f:
        response = client.post(
            "/api/upload-source",
            files={"file": ("test.pdf", f, "application/pdf")}
        )
    
    assert response.status_code == 200
    source_id = response.json()["source_id"]
    
    # Wait for processing (or mock it)
    # ... test chat functionality
    # ... test export functionality
```

## API Integration

### Frontend API Service

**Centralized API Client:**
```typescript
// src/services/api.ts
import axios, { AxiosResponse } from 'axios'
import type { Source, ChatResponse, PodcastTask } from '@/types/api'

// Configure base client
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? '/api' 
    : 'http://127.0.0.1:8000/api',
  timeout: 30000,
})

// Request interceptor for auth/logging
api.interceptors.request.use((config) => {
  config.headers['X-Request-ID'] = `${Date.now()}-${Math.random()}`
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      error.message = 'Network error. Is the backend running?'
    }
    return Promise.reject(error)
  }
)

// Type-safe API functions
export const sourceAPI = {
  upload: async (file: File): Promise<Source> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post<Source>('/upload-source', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  list: async (): Promise<Source[]> => {
    const response = await api.get<Source[]>('/sources')
    return response.data
  },

  delete: async (sourceId: string): Promise<void> => {
    await api.delete(`/sources/${sourceId}`)
  }
}

export const chatAPI = {
  send: async (message: string, sourceIds: string[]): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chat', {
      message,
      source_ids: sourceIds
    })
    return response.data
  }
}
```

**React Hook Integration:**
```typescript
// src/hooks/useAPI.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sourceAPI, chatAPI } from '@/services/api'
import { useToast } from './useToast'

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: sourceAPI.list,
    refetchOnWindowFocus: false,
  })
}

export function useUploadSource() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  
  return useMutation({
    mutationFn: sourceAPI.upload,
    onSuccess: (newSource) => {
      queryClient.setQueryData(['sources'], (old: Source[] = []) => 
        [...old, newSource]
      )
      showToast('success', 'File uploaded successfully')
    },
    onError: (error) => {
      showToast('error', 'Upload failed', error.message)
    }
  })
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  
  const sendMessage = async (message: string, sourceIds: string[]) => {
    setLoading(true)
    try {
      const response = await chatAPI.send(message, sourceIds)
      
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'user', content: message },
        { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: response.response,
          citations: response.citations
        }
      ])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return { messages, sendMessage, loading }
}
```

### Error Handling Patterns

**Centralized Error Management:**
```typescript
// src/utils/errorHandler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export function handleAPIError(error: any): APIError {
  if (error.response) {
    // Server responded with error status
    return new APIError(
      error.response.data?.detail || error.message,
      error.response.status,
      error.response.data?.error
    )
  } else if (error.request) {
    // Request made but no response
    return new APIError('Network error - no response received')
  } else {
    // Something else happened
    return new APIError(error.message)
  }
}

// Global error boundary
export function useErrorHandler() {
  const { showToast } = useToast()
  
  return useCallback((error: Error | APIError) => {
    console.error('Application error:', error)
    
    if (error instanceof APIError) {
      if (error.statusCode === 401) {
        // Handle authentication error
        showToast('error', 'Authentication required')
      } else if (error.statusCode >= 500) {
        // Handle server error
        showToast('error', 'Server error', 'Please try again later')
      } else {
        // Handle client error
        showToast('error', 'Request failed', error.message)
      }
    } else {
      // Handle unexpected errors
      showToast('error', 'Unexpected error', error.message)
    }
  }, [showToast])
}
```

## Testing Strategies

### Frontend Testing

**Component Testing Setup:**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

configure({ testIdAttribute: 'data-testid' })

// Mock window.electronAPI for tests
Object.defineProperty(window, 'electronAPI', {
  value: {
    openFile: jest.fn(),
    saveFile: jest.fn(),
  },
  writable: true,
})
```

**Custom Render Utility:**
```typescript
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: createWrapper(), ...options })
}
```

**E2E Testing with Playwright:**
```typescript
// e2e/utils/fixtures.ts
import { test as base } from '@playwright/test'

type TestFixtures = {
  mockAPI: {
    mockSources: () => Promise<void>
    mockChat: () => Promise<void>
  }
}

export const test = base.extend<TestFixtures>({
  mockAPI: async ({ page }, use) => {
    const mockAPI = {
      mockSources: async () => {
        await page.route('**/api/sources', async route => {
          await route.fulfill({
            json: [
              { id: '1', filename: 'test.pdf', status: 'completed' }
            ]
          })
        })
      },
      
      mockChat: async () => {
        await page.route('**/api/chat', async route => {
          await route.fulfill({
            json: {
              response: 'Test response',
              citations: []
            }
          })
        })
      }
    }
    
    await use(mockAPI)
  }
})
```

### Backend Testing

**Pytest Configuration:**
```python
# pytest.ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --cov=.
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
    -v
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
```

**Test Fixtures:**
```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app
from utils.database import Base, get_db_session

@pytest.fixture
def db_session():
    """Create test database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db_session):
    """Create test client with mocked database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db_session] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def sample_pdf():
    """Provide sample PDF for testing."""
    return Path("tests/fixtures/sample.pdf")
```

## Deployment and Operations

### Docker Configuration

**Multi-stage Dockerfile:**
```dockerfile
# Backend Dockerfile
FROM python:3.10-slim as backend-base

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM backend-base as backend-dev
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM backend-base as backend-prod
COPY . .
RUN pip install gunicorn
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

**Docker Compose for Development:**
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      target: backend-dev
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - ./data:/app/data
    environment:
      - BACKEND_DATA_DIR=/app/data
      - ALLOWED_ORIGINS=http://localhost:3000
    
  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE_URL=http://localhost:8000/api
```

### CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run tests
        run: |
          cd backend
          pytest --cov=. --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install
      
      - name: Type check
        run: |
          cd frontend
          pnpm run type-check
      
      - name: Lint
        run: |
          cd frontend
          pnpm run lint
      
      - name: Build
        run: |
          cd frontend
          pnpm run build
      
      - name: E2E tests
        run: |
          cd frontend
          pnpm dlx playwright install --with-deps
          pnpm run test:e2e

  build-app:
    needs: [backend-test, frontend-test]
    runs-on: macos-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Build Electron app
        run: |
          pnpm install
          pnpm run dist:mac
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: NotebookMLX-app
          path: dist/
```

## Contributing Guidelines

### Git Workflow

**Branch Naming Convention:**
```
feature/component-name        # New features
bugfix/issue-description     # Bug fixes
hotfix/critical-issue        # Critical fixes
refactor/module-name         # Code refactoring
docs/section-name           # Documentation updates
```

**Commit Message Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Pull Request Process:**
1. Create feature branch from `develop`
2. Implement changes with tests
3. Run quality checks: `pnpm run quality`
4. Create PR with description and screenshots
5. Request review from maintainers
6. Address feedback and merge

### Code Review Guidelines

**What to Look For:**
- Code follows established patterns
- Adequate test coverage
- Performance considerations
- Security implications
- Accessibility compliance
- Documentation updates

**Review Checklist:**
- [ ] Code is readable and well-commented
- [ ] TypeScript interfaces are properly defined
- [ ] Error handling is comprehensive
- [ ] Tests cover edge cases
- [ ] No sensitive data is exposed
- [ ] Performance impact is acceptable

### Release Process

**Version Management:**
```bash
# Bump version
npm version patch|minor|major

# Create release tag
git tag -a v1.2.3 -m "Release version 1.2.3"

# Build and package
pnpm run dist:mac

# Create GitHub release with binaries
```

**Release Notes Template:**
```markdown
## [1.2.3] - 2024-01-15

### Added
- New voice training capabilities
- Export to video format

### Changed
- Improved podcast generation speed
- Updated UI components

### Fixed
- Fixed audio synchronization issues
- Resolved memory leaks in large file processing

### Security
- Updated dependencies with security patches
```

This tutorial provides a comprehensive foundation for developing with NotebookMLX. As you work with the codebase, refer to the specific documentation files for detailed information about architecture, API endpoints, and component specifications.