FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Run the server
CMD ["node", "src/server.js"]
