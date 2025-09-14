# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install root dependencies
RUN npm install

# Copy source code
COPY . .
COPY frontend/ ./frontend/

# Install all dependencies
RUN cd backend && npm install
RUN cd frontend && npm install

# Build the application
RUN cd backend && npm run build
RUN cd frontend && npm run build

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
