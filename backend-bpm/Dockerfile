# Use a slim version for smaller image size
FROM python:3.12-slim

# Set environment variables
# PYTHONDONTWRITEBYTECODE: Prevents Python from writing pyc files to disc
# PYTHONUNBUFFERED: Ensures logs are flushed immediately (helps debug)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /api

# Install system dependencies
# (libpq is required for Postgres/PostGIS, gcc for compiling python libs)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

ENV FLASK_APP=flaskr

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .
COPY entrypoint.sh /entrypoint.sh

# Make it executable (Windows users often lose permission bits)
RUN chmod +x /entrypoint.sh

# Expose the port
EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]

# This is the "default" argument passed to "$@" in the entrypoint
CMD ["gunicorn", "--bind", "0.0.0.0:4000", "flaskr:app"]