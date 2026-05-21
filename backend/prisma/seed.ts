import { PrismaClient } from '@prisma/client';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
  const username = 'manoj_admin';
  const password = 'Manoj!@#8520';
  const email = 'manojdatascientist08@gmail.com';

  console.log('🌱 Seeding Super Admin...');

  // 1. Handle Clerk User Creation
  let clerkUserId = '';
  try {
    console.log(`☁️ Checking Clerk for user with email: ${email}...`);
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    
    if (users.length > 0) {
      console.log('⚠️ User already exists in Clerk. Updating password...');
      clerkUserId = users[0].id;
      await clerk.users.updateUser(clerkUserId, {
        password,
        username,
        skipPasswordChecks: true,
      });
      console.log('✅ Clerk user updated successfully!');
    } else {
      console.log('✨ Creating user in Clerk...');
      const newUser = await clerk.users.createUser({
        username,
        password,
        emailAddress: [email],
        firstName: 'Manoj',
        lastName: 'Admin',
        skipPasswordChecks: true,
      });
      clerkUserId = newUser.id;
      console.log('✅ Clerk user created successfully!');
    }

    // Force verify the email
    const updatedUser = await clerk.users.getUser(clerkUserId);
    for (const emailObj of updatedUser.emailAddresses) {
      if (emailObj.emailAddress === email && emailObj.verification?.status !== 'verified') {
        console.log(`🔧 Verifying email: ${email}`);
        await clerk.emailAddresses.updateEmailAddress(emailObj.id, {
          verified: true,
          primary: true
        });
        console.log('✅ Email marked as verified.');
      }
    }
  } catch (error: any) {
    console.error('❌ Clerk operation failed:', error.message);
  }

  // 2. Handle Prisma Database Seeding
  const existingAdmin = await prisma.admin.findUnique({
    where: { username },
  });

  if (existingAdmin) {
    console.log('⚠️ Super Admin already exists in database.');
  } else {
    await prisma.admin.create({
      data: {
        adminId: 'TBT-ADMIN-2026-0001',
        fullName: 'Sakthi SuperAdmin',
        email: email,
        contactNumber: '+919876543210',
        username: username,
        role: 'SuperAdmin',
        accountStatus: 'Active',
        department: 'Technology',
        designation: 'Chief Architect',
        rbac: {
          create: [
            { module: 'LMS', canView: true, canCreate: true, canEdit: true, canDelete: true },
            { module: 'Tasks', canView: true, canCreate: true, canEdit: true, canDelete: true },
            { module: 'Community', canView: true, canCreate: true, canEdit: true, canDelete: true },
            { module: 'Webinar', canView: true, canCreate: true, canEdit: true, canDelete: true },
          ],
        },
      },
    });
    console.log('✅ Database record created successfully!');
  }

  console.log(`
    🎉 Super Admin Setup Complete!
    ------------------------------
    Username: ${username}
    Password: ${password}
    Role: SuperAdmin
    Email: ${email}
    ------------------------------
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
