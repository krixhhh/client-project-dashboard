import http from 'http';
import app from './app';
import { env } from './config/env';
import { getPrismaClient } from './config/database';
import { ensureDatabaseSeeded } from './initDatabase';
import { initSocketServer } from './websocket/socket.server';
import { initOverdueTaskWorker } from './jobs/overdueTask.job';

const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocketServer(httpServer);

async function startServer() {
  try {
    // Ensure database client is ready & seeded
    await getPrismaClient();
    await ensureDatabaseSeeded();

    // Initialize BullMQ worker for background jobs
    try {
      initOverdueTaskWorker();
    } catch (err: any) {
      console.warn('[BullMQ] Queue initialization warning:', err.message);
    }

    const PORT = parseInt(env.PORT, 10);
    httpServer.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(` Client Project Dashboard Server Started `);
      console.log(` Port: ${PORT}`);
      console.log(` Environment: ${env.NODE_ENV}`);
      console.log(` Client URL: ${env.CLIENT_URL}`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
