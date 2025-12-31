import { MongoClient } from 'mongodb';
import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyAdminUser() {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/anvogue';
  
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('User');
    
    // Find the admin user
    const adminUser = await usersCollection.findOne({ 
      email: 'admin@anvogue.com' 
    });
    
    if (adminUser) {
      console.log('Admin user found:');
      console.log('- Email:', adminUser.email);
      console.log('- First Name:', adminUser.firstName);
      console.log('- Last Name:', adminUser.lastName);
      console.log('- Role:', adminUser.role);
      console.log('- Email Verified:', adminUser.emailVerified);
      console.log('- Created At:', adminUser.createdAt);
    } else {
      console.log('Admin user not found!');
    }
  } catch (error) {
    console.error('Error verifying admin user:', error);
  } finally {
    await client.close();
  }
}

verifyAdminUser();