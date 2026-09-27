const EmbeddedPostgres = require('embedded-postgres').default;
const net = require('net');

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function startPgServer() {
  const isOpen = await isPortOpen(5432);
  if (isOpen) {
    console.log('[PostgreSQL] Database port 5432 is already open and accepting connections.');
    return;
  }

  console.log('[PostgreSQL] Port 5432 not listening. Starting Embedded PostgreSQL database server...');
  const pg = new EmbeddedPostgres({
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'client_dashboard',
    persistent: true,
  });

  try {
    await pg.initialise();
    await pg.start();
    await pg.createDatabase('client_dashboard');
    console.log('[PostgreSQL] Embedded PostgreSQL running on port 5432!');
  } catch (err) {
    console.warn('[PostgreSQL] Notice:', err.message);
  }
}

if (require.main === module) {
  startPgServer();
}

module.exports = { startPgServer };
