# setup-mongodb.ps1 - Script to set up MongoDB replica set and initialize database

Write-Host "Starting MongoDB setup..." -ForegroundColor Green

# Start MongoDB in Docker
Write-Host "Starting MongoDB container..." -ForegroundColor Yellow
docker-compose up -d mongo

# Wait for MongoDB to be ready
Write-Host "Waiting for MongoDB to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Initialize replica set
Write-Host "Initializing replica set..." -ForegroundColor Yellow
docker-compose run --rm mongo-init

# Wait for replica set to be initialized
Start-Sleep -Seconds 15

# Run Prisma migrations
Write-Host "Running Prisma migrations..." -ForegroundColor Yellow
npm run prisma:generate
npm run prisma:db:push

# Create admin user
Write-Host "Creating admin user..." -ForegroundColor Yellow
npm run create-admin

Write-Host "MongoDB setup completed successfully!" -ForegroundColor Green
Write-Host "You can now start the application with 'npm run start:dev'" -ForegroundColor Green