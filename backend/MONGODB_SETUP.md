# Anvogue E-commerce Backend - MongoDB Setup Guide

## Issue: MongoDB Replica Set Required

The application uses Prisma with MongoDB, which requires MongoDB to be configured as a replica set to support transactions. When you encounter this error:

```
Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set.
```

## Solution: Set up MongoDB as a Replica Set (Without Docker)

### Option 1: Manual MongoDB Replica Set Setup

1. **Stop any running MongoDB service:**
   ```bash
   # On Windows
   net stop MongoDB
   ```

2. **Start MongoDB with replica set option:**
   ```bash
   # Start MongoDB with replica set configuration
   mongod --replSet "rs0" --dbpath "C:\data\db" --port 27017
   ```

3. **Initialize the replica set:**
   Open a new terminal/command prompt and run:
   ```bash
   mongosh
   ```

   Then in the MongoDB shell, run:
   ```javascript
   rs.initiate({
     _id: "rs0",
     members: [
       { _id: 0, host: "localhost:27017" }
     ]
   });
   ```

4. **Run Prisma migrations:**
   ```bash
   npm run prisma:generate
   npm run prisma:db:push
   ```

5. **Create admin user:**
   ```bash
   npm run create-admin
   ```

6. **Start the application:**
   ```bash
   npm run start:dev
   ```

### Option 2: Using the Batch Setup Script (Windows)

Run the batch script to automate the setup:

```bash
setup-mongodb-no-docker.bat
```

This script will:
- Start MongoDB as a replica set
- Initialize the replica set
- Run Prisma migrations
- Create the admin user

### Option 3: Using the PowerShell Setup Script

Run the PowerShell script to automate the setup:

```powershell
.\setup-mongodb.ps1
```

## API Endpoint

Once the MongoDB replica set is configured, the login endpoint will work correctly:

- **URL**: `http://localhost:3001/api/auth/login`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "admin@anvogue.com",
    "password": "admin123"
  }
  ```

## Troubleshooting

If you still encounter issues:

1. **Verify MongoDB connection:**
   ```bash
   npm run verify-admin
   ```

2. **Check if replica set is active:**
   Connect to MongoDB and run:
   ```javascript
   rs.status()
   ```

3. **Check the application logs** for any additional errors.