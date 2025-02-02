# Use the official Node.js image from the Docker Hub as the base image
FROM node:22

# Create and change to the app directory
WORKDIR /app

# Copy only package files first for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# TESTING PURPOSES
RUN npx prisma migrate dev --name fix_column_names

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Set correct permissions before switching users
RUN chown -R node:node /app

# Use a non-root user (important for OpenShift/Rahti 2)
USER node

# Expose the port the app runs on
EXPOSE 8080

# Run the app
CMD ["sh", "-c", "if [ \"$MODE\" = 'development' ]; then npm run dev; else npm start; fi"]
