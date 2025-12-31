#!/bin/bash
# setup-mongodb.sh - Script to set up MongoDB replica set and initialize database

echo "Starting MongoDB setup..."

# Start MongoDB in Docker
echo "Starting MongoDB container..."
docker-compose up -d mongo

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
sleep 30

# Initialize replica set
echo "Initializing replica set..."
docker-compose run --rm mongo-init

# Wait for replica set to be initialized
sleep 15

# Run Prisma migrations
echo "Running Prisma migrations..."
npm run prisma:generate
npm run prisma:db:push

# Create admin user
echo "Creating admin user..."
npm run create-admin

echo "MongoDB setup completed successfully!"
echo "You can now start the application with 'npm run start:dev'"