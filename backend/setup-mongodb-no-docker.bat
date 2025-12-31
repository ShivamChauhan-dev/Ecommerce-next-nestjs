@echo off
echo Setting up MongoDB Replica Set...

echo Step 1: Starting MongoDB as replica set...
start cmd /k "mongod --replSet rs0 --dbpath C:\data\db --port 27017"

echo Waiting for MongoDB to start...
timeout /t 10 /nobreak >nul

echo Step 2: Initializing replica set...
mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]}); print('Replica set initialized');"

echo Waiting for replica set to initialize...
timeout /t 10 /nobreak >nul

echo Step 3: Running Prisma migrations...
npm run prisma:generate
npm run prisma:db:push

echo Step 4: Creating admin user...
npm run create-admin

echo Setup complete! You can now start the application with 'npm run start:dev'
pause