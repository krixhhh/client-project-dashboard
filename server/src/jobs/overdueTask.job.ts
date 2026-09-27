import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import { prisma } from '../config/database';
import { TaskStatus } from '@prisma/client';
import { emitActivity, emitNotification } from '../websocket/socket.server';

export const OVERDUE_QUEUE_NAME = 'overdue-task-processing';

export const overdueQueue = new Queue(OVERDUE_QUEUE_NAME, {
  connection: { host: '127.0.0.1', port: 6379 },
});

export async function processOverdueTasksJob() {
  console.log('[Background Job] Running overdue task scanner...');

  const now = new Date();

  // Find incomplete tasks that passed due date and are not yet flagged as overdue
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: { not: TaskStatus.DONE },
      dueDate: { lt: now },
      isOverdue: false,
    },
    include: {
      project: { select: { id: true, name: true, projectManagerId: true } },
      developer: { select: { id: true, name: true, email: true } },
    },
  });

  if (overdueTasks.length === 0) {
    console.log('[Background Job] No new overdue tasks detected.');
    return { processedCount: 0 };
  }

  console.log(`[Background Job] Found ${overdueTasks.length} newly overdue task(s).`);

  for (const task of overdueTasks) {
    // 1. Mark as overdue
    await prisma.task.update({
      where: { id: task.id },
      data: { isOverdue: true },
    });

    // 2. Create ActivityLog record
    const systemUserId = task.project.projectManagerId; // Attribute to system / PM
    const activity = await prisma.activityLog.create({
      data: {
        projectId: task.projectId,
        taskId: task.id,
        actorId: systemUserId,
        action: 'TASK_OVERDUE',
        oldValue: task.status,
        newValue: 'OVERDUE',
        message: `Task "${task.title}" has passed its due date (${task.dueDate.toLocaleDateString()}) and is OVERDUE`,
      },
      include: {
        actor: { select: { id: true, name: true, role: true } },
      },
    });

    // 3. Broadcast real-time activity
    emitActivity(activity, task.projectId, task.developerId);

    // 4. Notify Developer if assigned
    if (task.developerId) {
      const notifDev = await prisma.notification.create({
        data: {
          recipientId: task.developerId,
          type: 'TASK_OVERDUE',
          title: 'Task Overdue Notice',
          message: `Your task "${task.title}" is overdue!`,
          relatedProjectId: task.projectId,
          relatedTaskId: task.id,
        },
      });
      emitNotification(notifDev, task.developerId);
    }

    // 5. Notify PM
    const notifPM = await prisma.notification.create({
      data: {
        recipientId: task.project.projectManagerId,
        type: 'TASK_OVERDUE',
        title: 'Project Task Overdue Alert',
        message: `Task "${task.title}" in project "${task.project.name}" is overdue!`,
        relatedProjectId: task.projectId,
        relatedTaskId: task.id,
      },
    });
    emitNotification(notifPM, task.project.projectManagerId);
  }

  return { processedCount: overdueTasks.length };
}

export function initOverdueTaskWorker() {
  const worker = new Worker(
    OVERDUE_QUEUE_NAME,
    async (job: Job) => {
      console.log(`[BullMQ Worker] Processing job ${job.id} - ${job.name}`);
      return await processOverdueTasksJob();
    },
    { connection: { host: '127.0.0.1', port: 6379 } }
  );

  worker.on('completed', (job, result) => {
    console.log(`[BullMQ Worker] Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
  });

  // Schedule repeatable job every 60 seconds
  overdueQueue.add(
    'check-overdue-tasks',
    {},
    {
      repeat: {
        every: 60000, // Every 1 minute
      },
      removeOnComplete: true,
    }
  );

  console.log('[BullMQ Scheduler] Overdue task scanner scheduled (interval: 60s)');
}
