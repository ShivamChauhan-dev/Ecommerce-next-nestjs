import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@anvogue.com' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@anvogue.com');
      console.log('Skipping admin user creation.');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create the admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@anvogue.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Anvogue',
        role: 'ADMIN', // Set role as ADMIN
        emailVerified: true, // Mark as verified
      },
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@anvogue.com');
    console.log('Password: admin123');
    console.log('Role: ADMIN');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createAdminUser();