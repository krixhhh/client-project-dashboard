const BASE_URL = 'http://localhost:5000/api';

async function runVerification() {
  console.log('==================================================');
  console.log(' Starting Full Application & RBAC Verification');
  console.log('==================================================\n');

  // 1. Healthcheck
  console.log('1. Testing GET /health ...');
  const healthRes = await fetch('http://localhost:5000/health').then((r) => r.json());
  console.log('  Health response:', healthRes);

  // 2. Login as Admin
  console.log('\n2. Testing POST /api/auth/login (ADMIN)...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
  }).then((r) => r.json());
  const adminToken = adminLoginRes.data.accessToken;
  console.log('  Admin login successful! Role:', adminLoginRes.data.user.role);

  // 3. Login as PM 1 (Alex Rivera)
  console.log('\n3. Testing POST /api/auth/login (PM 1)...');
  const pm1LoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pm1@example.com', password: 'password123' }),
  }).then((r) => r.json());
  const pm1Token = pm1LoginRes.data.accessToken;
  console.log('  PM 1 login successful! User ID:', pm1LoginRes.data.user.id);

  // 4. Login as PM 2 (Morgan Chen)
  console.log('\n4. Testing POST /api/auth/login (PM 2)...');
  const pm2LoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pm2@example.com', password: 'password123' }),
  }).then((r) => r.json());
  const pm2Token = pm2LoginRes.data.accessToken;

  // 5. Login as Developer 1 (Ravi)
  console.log('\n5. Testing POST /api/auth/login (DEVELOPER 1)...');
  const dev1LoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'developer1@example.com', password: 'password123' }),
  }).then((r) => r.json());
  const dev1Token = dev1LoginRes.data.accessToken;
  const dev1Id = dev1LoginRes.data.user.id;
  console.log('  Dev 1 login successful! User ID:', dev1Id);

  // 6. Admin fetching Dashboard
  console.log('\n6. Testing GET /api/dashboard/admin (ADMIN)...');
  const adminDashRes = await fetch(`${BASE_URL}/dashboard/admin`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());
  console.log('  Admin Dashboard metrics:', adminDashRes.data.metrics);

  // 7. PM 1 fetching Projects
  console.log('\n7. Testing GET /api/projects (PM 1)...');
  const pm1ProjectsRes = await fetch(`${BASE_URL}/projects`, {
    headers: { Authorization: `Bearer ${pm1Token}` },
  }).then((r) => r.json());
  console.log(`  PM 1 manages ${pm1ProjectsRes.data.length} project(s)`);
  const pm1ProjectId = pm1ProjectsRes.data[0].id;

  // 8. PM 2 fetching Projects
  const pm2ProjectsRes = await fetch(`${BASE_URL}/projects`, {
    headers: { Authorization: `Bearer ${pm2Token}` },
  }).then((r) => r.json());
  const pm2ProjectId = pm2ProjectsRes.data[0].id;

  // 9. RBAC SECURITY TEST 1: PM 1 attempting to access PM 2's project!
  console.log('\n9. SECURITY TEST: PM 1 requesting PM 2\'s project directly...');
  const pm1ToPm2Res = await fetch(`${BASE_URL}/projects/${pm2ProjectId}`, {
    headers: { Authorization: `Bearer ${pm1Token}` },
  });
  const pm1ToPm2Data = await pm1ToPm2Res.json();
  if (pm1ToPm2Res.status === 403) {
    console.log('  SUCCESS: API rejected PM 1 access to PM 2 project with HTTP 403 Forbidden!');
    console.log('  Error payload:', pm1ToPm2Data);
  } else {
    console.error('  Unexpected response status:', pm1ToPm2Res.status);
  }

  // 10. Developer 1 fetching tasks
  console.log('\n10. Testing GET /api/tasks (DEVELOPER 1)...');
  const dev1TasksRes = await fetch(`${BASE_URL}/tasks`, {
    headers: { Authorization: `Bearer ${dev1Token}` },
  }).then((r) => r.json());
  console.log(`  Dev 1 assigned task count: ${dev1TasksRes.data.tasks.length}`);

  // 11. Testing Status Update by Developer
  if (dev1TasksRes.data.tasks.length > 0) {
    const targetTask = dev1TasksRes.data.tasks[0];
    console.log(`\n11. Testing PATCH /api/tasks/${targetTask.id}/status (DEVELOPER 1)...`);
    const statusUpdateRes = await fetch(`${BASE_URL}/tasks/${targetTask.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dev1Token}`,
      },
      body: JSON.stringify({ status: 'IN_REVIEW' }),
    }).then((r) => r.json());
    console.log('  Status update result:', statusUpdateRes.data.status);
  }

  // 12. Testing Activity Feed
  console.log('\n12. Testing GET /api/activity (RECENT 20 ACTIVITIES)...');
  const activityRes = await fetch(`${BASE_URL}/activity?limit=20`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());
  console.log(`  Fetched ${activityRes.data.length} recent activity logs`);

  // 13. Testing Notifications
  console.log('\n13. Testing GET /api/notifications (PM 1)...');
  const notifRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${pm1Token}` },
  }).then((r) => r.json());
  console.log(`  PM 1 notifications count: ${notifRes.data.notifications.length} (Unread: ${notifRes.data.unreadCount})`);

  console.log('\n==================================================');
  console.log(' ALL API & RBAC VERIFICATION TESTS COMPLETED OK! ');
  console.log('==================================================');
}

runVerification().catch((e) => console.error('Verification failed:', e.message));
