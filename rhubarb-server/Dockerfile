# Rhubarb Lip Sync Server
FROM node:18-slim

# Install dependencies for Rhubarb + ffmpeg for audio conversion
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    libstdc++6 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Download and install Rhubarb (keep res folder with binary for acoustic models)
WORKDIR /opt
RUN wget -q https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Linux.zip \
    && unzip Rhubarb-Lip-Sync-1.13.0-Linux.zip \
    && mv Rhubarb-Lip-Sync-1.13.0-Linux /opt/rhubarb \
    && chmod +x /opt/rhubarb/rhubarb \
    && rm -f Rhubarb-Lip-Sync-1.13.0-Linux.zip

# Verify installation
RUN /opt/rhubarb/rhubarb --version

# Set up the app
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Set environment
ENV NODE_ENV=production
ENV RHUBARB_PATH=/opt/rhubarb/rhubarb

EXPOSE 3001
CMD ["npm", "start"]

