# Use official Node.js image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files first (improves caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema & migrations
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Ensure correct permissions for OpenShift (Writable Prisma)
RUN chmod -R 777 /app/prisma

# Expose app port
EXPOSE 8080

# Run the app with environment-based start command
CMD ["sh", "-c", "if [ \"$MODE\" = 'development' ]; then npm run dev; else npm start; fi"]
