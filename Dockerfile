# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
