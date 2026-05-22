FROM python:3.12-slim

# Prevent Python buffering
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Expose app port
EXPOSE 8713

# Run app
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8713", "app:app"]