// init-mongo.js
// This script initializes MongoDB as a replica set for Prisma compatibility

function initReplicaSet() {
  try {
    // Check if replica set is already initialized
    const status = rs.status();
    if (status.ok === 1) {
      print("Replica set is already initialized");
      return;
    }
  } catch (e) {
    // Replica set not initialized, continue with initialization
    print("Initializing replica set...");
  }

  // Initialize the replica set
  rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "localhost:27017" }
    ]
  });

  // Wait a bit for the replica set to initialize
  sleep(5000);

  // Check the status
  const result = rs.status();
  if (result.ok === 1) {
    print("Replica set initialized successfully!");
  } else {
    print("Failed to initialize replica set");
  }
}

// Run the initialization
initReplicaSet();