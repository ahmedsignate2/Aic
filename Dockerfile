# Multi-platform Android build Dockerfile
# Supports both x86-64 and ARM64 hosts
FROM --platform=linux/amd64 ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    git \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set up Android SDK
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    cd $ANDROID_HOME/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
    unzip commandlinetools-linux-11076708_latest.zip && \
    mv cmdline-tools latest && \
    rm commandlinetools-linux-11076708_latest.zip

# Accept licenses and install required packages
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-35" "build-tools;34.0.0" "ndk;27.1.12297006"

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install npm dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Apply dependency patches
RUN sed -i "s/compile 'com.facebook.react:react-native:+'/implementation 'com.facebook.react:react-native:+'/" node_modules/react-native-scrypt/android/build.gradle && \
    sed -i 's/view\.pointerEvents = PointerEvents\.parsePointerEvents(pointerEventsStr)/view.setPointerEvents(PointerEvents.parsePointerEvents(pointerEventsStr))/' node_modules/@lodev09/react-native-true-sheet/android/src/main/java/com/lodev09/truesheet/*ViewManager.kt && \
    sed -i 's/super\.hitSlopRect = value/super.setHitSlopRect(value)/' node_modules/@react-native-menu/menu/android/src/main/java/com/reactnativemenu/MenuView.kt && \
    sed -i 's/mHitSlopRect = value/field = value/' node_modules/@react-native-menu/menu/android/src/main/java/com/reactnativemenu/MenuView.kt && \
    sed -i 's/view\.hitSlopRect = null/view.setHitSlopRect(null)/' node_modules/@react-native-menu/menu/android/src/main/java/com/reactnativemenu/MenuViewManagerBase.kt && \
    sed -i 's/view\.hitSlopRect = (/view.setHitSlopRect(/' node_modules/@react-native-menu/menu/android/src/main/java/com/reactnativemenu/MenuViewManagerBase.kt && \
    sed -i 's/view\.overflow = overflow/view.setOverflow(overflow)/' node_modules/@react-native-menu/menu/android/src/main/java/com/reactnativemenu/MenuViewManagerBase.kt

# Build the APK
WORKDIR /app/android
RUN chmod +x gradlew && \
    ./gradlew clean && \
    ./gradlew assembleRelease --no-daemon -PhermesEnabled=false

# Output location
RUN echo "APK built at: /app/android/app/build/outputs/apk/release/"
