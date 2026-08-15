# Use LTS Node.js Alpine base image
FROM node:22-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Copy source code and configuration
COPY tsconfig.json ./
COPY src ./src

# Expose port 3000
EXPOSE 3000

# Run development server with live reload via tsx
CMD ["npm", "run", "dev"]
