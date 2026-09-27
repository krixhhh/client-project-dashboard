/// <reference types="node" />
import { PrismaClient, Role, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // Clean existing records in reverse dependency order
  await prisma.refreshToken.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Connor (Admin)',
      email: 'admin@example.com',
      passwordHash,
      role: Role.ADMIN,
      lastSeenAt: new Date(),
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      name: 'Alex Rivera (PM)',
      email: 'pm1@example.com',
      passwordHash,
      role: Role.PROJECT_MANAGER,
      lastSeenAt: new Date(Date.now() - 3600000),
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      name: 'Morgan Chen (PM)',
      email: 'pm2@example.com',
      passwordHash,
      role: Role.PROJECT_MANAGER,
      lastSeenAt: new Date(Date.now() - 7200000),
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      name: 'Ravi Kumar',
      email: 'developer1@example.com',
      passwordHash,
      role: Role.DEVELOPER,
      lastSeenAt: new Date(),
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'developer2@example.com',
      passwordHash,
      role: Role.DEVELOPER,
      lastSeenAt: new Date(Date.now() - 1800000),
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      name: 'David Kim',
      email: 'developer3@example.com',
      passwordHash,
      role: Role.DEVELOPER,
      lastSeenAt: new Date(Date.now() - 86400000),
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      name: 'Sophia Patel',
      email: 'developer4@example.com',
      passwordHash,
      role: Role.DEVELOPER,
      lastSeenAt: new Date(Date.now() - 43200000),
    },
  });

  // 2. Create Clients
  console.log('Creating clients...');
  const clientAcme = await prisma.client.create({
    data: {
      name: 'Acme Corporation',
      contactEmail: 'contact@acme.com',
      contactPhone: '+1-555-0192',
      company: 'Acme Corp',
    },
  });

  const clientStarlight = await prisma.client.create({
    data: {
      name: 'Starlight Media',
      contactEmail: 'hello@starlight.io',
      contactPhone: '+1-555-0344',
      company: 'Starlight Holdings',
    },
  });

  const clientNexus = await prisma.client.create({
    data: {
      name: 'Nexus Health Systems',
      contactEmail: 'info@nexushealth.org',
      contactPhone: '+1-555-0821',
      company: 'Nexus Health Inc.',
    },
  });

  // 3. Create Projects
  console.log('Creating projects...');
  const projectECommerce = await prisma.project.create({
    data: {
      name: 'Acme E-Commerce Platform Redesign',
      description: 'Full-stack rebuild of the customer e-commerce store with high performance checkout.',
      clientId: clientAcme.id,
      projectManagerId: pm1.id,
    },
  });

  const projectMobileApp = await prisma.project.create({
    data: {
      name: 'Starlight Streaming Mobile App',
      description: 'Cross-platform mobile streaming application for iOS and Android video delivery.',
      clientId: clientStarlight.id,
      projectManagerId: pm1.id,
    },
  });

  const projectHealthPortal = await prisma.project.create({
    data: {
      name: 'Nexus Patient Portal Integration',
      description: 'Secure patient record portal with real-time appointment scheduling and messaging.',
      clientId: clientNexus.id,
      projectManagerId: pm2.id,
    },
  });

  // 4. Create Tasks
  console.log('Creating tasks...');
  const now = new Date();
  const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago (Overdue)
  const futureDate1 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days ahead
  const futureDate2 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead
  const futureDate3 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days ahead

  // Project 1 Tasks (PM1)
  const t1 = await prisma.task.create({
    data: {
      projectId: projectECommerce.id,
      title: 'Design Database Schema for Products & Inventory',
      description: 'Create normalized relational schema for products, variants, and stock tracking.',
      developerId: dev1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: futureDate1,
    },
  });

  const t2 = await prisma.task.create({
    data: {
      projectId: projectECommerce.id,
      title: 'Implement Stripe Payment Gateway Integration',
      description: 'Connect checkout API with Stripe webhooks and multi-currency calculation.',
      developerId: dev1.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: futureDate1,
    },
  });

  const t3 = await prisma.task.create({
    data: {
      projectId: projectECommerce.id,
      title: 'Build Shopping Cart & Checkout Frontend UI',
      description: 'Responsive cart drawer and seamless step-by-step payment flow components.',
      developerId: dev2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: futureDate2,
    },
  });

  const t4 = await prisma.task.create({
    data: {
      projectId: projectECommerce.id,
      title: 'Setup Redis Caching for Product Catalog',
      description: 'Cache frequently accessed categories and product details to reduce DB load.',
      developerId: dev2.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: pastDate,
      isOverdue: true,
    },
  });

  const t5 = await prisma.task.create({
    data: {
      projectId: projectECommerce.id,
      title: 'Configure Automated ElasticSearch Indexing',
      description: 'Index store items on publish/update for instant search filtering.',
      developerId: dev1.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: futureDate3,
    },
  });

  // Project 2 Tasks (PM1)
  const t6 = await prisma.task.create({
    data: {
      projectId: projectMobileApp.id,
      title: 'Implement OAuth2 Mobile Login Flow',
      description: 'Support Google, Apple, and Email authentication in React Native app.',
      developerId: dev2.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: futureDate1,
    },
  });

  const t7 = await prisma.task.create({
    data: {
      projectId: projectMobileApp.id,
      title: 'HLS Video Player Core Pipeline',
      description: 'Integrate adaptive video streaming with low latency player controls.',
      developerId: dev3.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: futureDate2,
    },
  });

  const t8 = await prisma.task.create({
    data: {
      projectId: projectMobileApp.id,
      title: 'Push Notification Dispatch Service',
      description: 'Send push alerts for new live releases and user subscription updates.',
      developerId: dev3.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate1,
    },
  });

  const t9 = await prisma.task.create({
    data: {
      projectId: projectMobileApp.id,
      title: 'Offline Video Downloading Logic',
      description: 'Encrypted storage for offline playback of downloaded episodes.',
      developerId: dev2.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: pastDate,
      isOverdue: true,
    },
  });

  const t10 = await prisma.task.create({
    data: {
      projectId: projectMobileApp.id,
      title: 'User Profile & Subscription Management',
      description: 'View active plan details, billing history, and profile settings.',
      developerId: dev3.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: futureDate3,
    },
  });

  // Project 3 Tasks (PM2)
  const t11 = await prisma.task.create({
    data: {
      projectId: projectHealthPortal.id,
      title: 'HIPAA Compliant Data Encryption at Rest',
      description: 'Enforce AES-256 field level encryption for patient records in PostgreSQL.',
      developerId: dev4.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: futureDate1,
    },
  });

  const t12 = await prisma.task.create({
    data: {
      projectId: projectHealthPortal.id,
      title: 'Appointment Scheduling Calendar Component',
      description: 'Interactive booking calendar showing provider availability in real time.',
      developerId: dev4.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: futureDate2,
    },
  });

  const t13 = await prisma.task.create({
    data: {
      projectId: projectHealthPortal.id,
      title: 'Secure Doctor-Patient Messaging Engine',
      description: 'Encrypted direct messaging with attachment scan verification.',
      developerId: dev4.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate3,
    },
  });

  const t14 = await prisma.task.create({
    data: {
      projectId: projectHealthPortal.id,
      title: 'Lab Test Results PDF Exporter',
      description: 'Generate formatted PDF medical reports directly from lab results data.',
      developerId: dev3.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate1,
    },
  });

  const t15 = await prisma.task.create({
    data: {
      projectId: projectHealthPortal.id,
      title: 'Audit Logging System for Record Access',
      description: 'Track every clinician access request to patient files for compliance auditing.',
      developerId: dev4.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: futureDate2,
    },
  });

  // 5. Activity Logs
  console.log('Creating activity logs...');
  await prisma.activityLog.createMany({
    data: [
      {
        projectId: projectECommerce.id,
        taskId: t1.id,
        actorId: dev1.id,
        action: 'STATUS_CHANGED',
        oldValue: 'IN_REVIEW',
        newValue: 'DONE',
        message: 'Ravi moved "Design Database Schema for Products & Inventory" from In Review -> Done',
        createdAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        projectId: projectECommerce.id,
        taskId: t2.id,
        actorId: dev1.id,
        action: 'STATUS_CHANGED',
        oldValue: 'IN_PROGRESS',
        newValue: 'IN_REVIEW',
        message: 'Ravi moved "Implement Stripe Payment Gateway Integration" from In Progress -> In Review',
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        projectId: projectECommerce.id,
        taskId: t3.id,
        actorId: dev2.id,
        action: 'STATUS_CHANGED',
        oldValue: 'TODO',
        newValue: 'IN_PROGRESS',
        message: 'Elena moved "Build Shopping Cart & Checkout Frontend UI" from TODO -> In Progress',
        createdAt: new Date(Date.now() - 3600000 * 1),
      },
      {
        projectId: projectMobileApp.id,
        taskId: t8.id,
        actorId: dev3.id,
        action: 'STATUS_CHANGED',
        oldValue: 'IN_PROGRESS',
        newValue: 'IN_REVIEW',
        message: 'David moved "Push Notification Dispatch Service" from In Progress -> In Review',
        createdAt: new Date(Date.now() - 3600000 * 3),
      },
      {
        projectId: projectHealthPortal.id,
        taskId: t12.id,
        actorId: dev4.id,
        action: 'STATUS_CHANGED',
        oldValue: 'IN_PROGRESS',
        newValue: 'IN_REVIEW',
        message: 'Sophia moved "Appointment Scheduling Calendar Component" from In Progress -> In Review',
        createdAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        projectId: projectECommerce.id,
        taskId: t4.id,
        actorId: admin.id,
        action: 'TASK_OVERDUE',
        oldValue: 'TODO',
        newValue: 'OVERDUE',
        message: 'System background scheduler flagged task "Setup Redis Caching for Product Catalog" as Overdue',
        createdAt: new Date(Date.now() - 1800000),
      },
    ],
  });

  // 6. Notifications
  console.log('Creating initial notifications...');
  await prisma.notification.createMany({
    data: [
      {
        recipientId: dev1.id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: 'You have been assigned to task "Implement Stripe Payment Gateway Integration"',
        relatedProjectId: projectECommerce.id,
        relatedTaskId: t2.id,
        isRead: false,
        createdAt: new Date(Date.now() - 7200000),
      },
      {
        recipientId: pm1.id,
        type: 'TASK_IN_REVIEW',
        title: 'Task Ready for Review',
        message: 'Ravi moved task "Implement Stripe Payment Gateway Integration" to In Review',
        relatedProjectId: projectECommerce.id,
        relatedTaskId: t2.id,
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        recipientId: pm2.id,
        type: 'TASK_IN_REVIEW',
        title: 'Task Ready for Review',
        message: 'Sophia moved task "Appointment Scheduling Calendar Component" to In Review',
        relatedProjectId: projectHealthPortal.id,
        relatedTaskId: t12.id,
        isRead: true,
        readAt: new Date(Date.now() - 1800000),
        createdAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        recipientId: dev2.id,
        type: 'TASK_OVERDUE',
        title: 'Task Overdue Alert',
        message: 'Task "Setup Redis Caching for Product Catalog" has passed its due date!',
        relatedProjectId: projectECommerce.id,
        relatedTaskId: t4.id,
        isRead: false,
        createdAt: new Date(Date.now() - 1800000),
      },
    ],
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
