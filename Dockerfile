# Use official Node.js image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files first (improves caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema & migrations **before chmod**
COPY prisma ./prisma/

# Copy the rest of the application code
COPY . .

# Ensure correct permissions for OpenShift (Writable Prisma)
# Uncomment when running "npx prisma db pull" in pod terminal for example
# RUN chmod -R 777 /app/prisma

# Generate Prisma client
RUN npx prisma generate

# Expose app port
EXPOSE 8080

# Run the app with environment-based start command
CMD ["sh", "-c", "if [ \"$MODE\" = 'development' ]; then npm run dev; else npm start; fi"]
