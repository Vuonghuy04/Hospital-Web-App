# Python ML Service Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY ml-service/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML service files
COPY ml-service/python_ml_service.py .
COPY ml-service/risk_prediction_service.py .
COPY ml-service/behavior_profiler.py .

# Copy model and data files
COPY data/models/iso_forest_time_encoders.pkl ./
COPY data/datasets/*.csv ./

# Create directory for model files
RUN mkdir -p /app/models

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5001/health', timeout=5)"

# Start the ML service
CMD ["python", "python_ml_service.py"]
