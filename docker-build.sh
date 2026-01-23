#!/bin/bash
# Docker build script for Android APK on ARM64 hosts

set -e

echo "🚀 Starting Docker build for Android APK..."
echo "📦 Platform: linux/amd64 (with ARM64 host emulation)"
echo ""

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and log back in for group changes to take effect."
    echo "Then run this script again."
    exit 1
fi

# Check if running with sudo/root access for docker (if user not in docker group)
if ! docker ps &> /dev/null; then
    echo "⚠️  Cannot access Docker. Trying with sudo..."
    DOCKER_CMD="sudo docker"
else
    DOCKER_CMD="docker"
fi

# Build the Docker image
echo "�� Building Docker image (this may take 10-20 minutes)..."
$DOCKER_CMD build --platform linux/amd64 -t android-builder:latest .

# Create a container and extract the APK
echo "📦 Extracting APK from container..."
CONTAINER_ID=$($DOCKER_CMD create android-builder:latest)

# Create output directory
mkdir -p ./build-output

# Copy APK from container
$DOCKER_CMD cp $CONTAINER_ID:/app/android/app/build/outputs/apk/release/app-release.apk ./build-output/

# Cleanup
$DOCKER_CMD rm $CONTAINER_ID

echo ""
echo "✅ Build complete!"
echo "📱 APK location: ./build-output/app-release.apk"
echo ""
ls -lh ./build-output/app-release.apk
