# Use the official Node.js image from the Docker Hub as the base image
FROM node:22

# Create and change to the app directory
WORKDIR /app

# Copy only package files first for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install
RUN npm install -g @prisma/client

# Copy the rest of the application code
COPY . .

# Run as user node (not root)
RUN chown -R node:node /app
RUN chmod -R 777 /app/node_modules/.prisma/client
USER node

# Expose the port the app runs on
EXPOSE 8080

# Run the app
CMD ["sh", "-c", "if [ \"$MODE\" = 'development' ]; then npm run dev; else npm start; fi"]
