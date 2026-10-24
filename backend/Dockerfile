FROM python:3.12-slim

# Install uv for fast reproducible builds
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000 \
    DB_PATH=/app/data/elexon_wind.db

# Copy dependency manifests
COPY pyproject.toml uv.lock ./

# Install locked dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY app/ ./app/

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
