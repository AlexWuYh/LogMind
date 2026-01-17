const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('Starting API Tests...');
  let failed = false;

  // Helper for requests
  async function request(path, options = {}) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, options);
      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      return { status: res.status, data };
    } catch (e) {
      console.error(`Error requesting ${path}:`, e.message);
      return { status: 500, error: e };
    }
  }

  // 1. Test Home Page
  console.log('\n1. Testing Home Page...');
  const home = await request('/');
  if (home.status === 200) {
    console.log('✅ Home Page Loaded');
  } else {
    console.error('❌ Home Page Failed:', home.status);
    failed = true;
  }

  // 2. Test Dashboard API
  console.log('\n2. Testing Dashboard API...');
  const dashboard = await request('/api/dashboard');
  if (dashboard.status === 200 && dashboard.data.totalLogs !== undefined) {
    console.log('✅ Dashboard API working');
  } else {
    console.error('❌ Dashboard API Failed:', dashboard.status, dashboard.data);
    failed = true;
  }

  // 3. Test Create Daily Log
  console.log('\n3. Testing Create Daily Log...');
  const today = new Date().toISOString().split('T')[0];
  const logData = {
    date: today,
    project: 'LogMind Test',
    priority: 'HIGH',
    progress: 50,
    summary: 'Testing API',
    items: [
      { content: 'Created test script', progress: 100, priority: 'HIGH' }
    ]
  };
  
  const createLog = await request('/api/daily-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logData)
  });
  
  if (createLog.status === 200 && createLog.data.date === today) {
    console.log('✅ Create Daily Log working');
  } else {
    console.error('❌ Create Daily Log Failed:', createLog.status, createLog.data);
    failed = true;
  }

  // 4. Test Get Daily Log
  console.log('\n4. Testing Get Daily Log...');
  const getLog = await request(`/api/daily-logs/${today}`);
  if (getLog.status === 200 && getLog.data.project === 'LogMind Test') {
    console.log('✅ Get Daily Log working');
  } else {
    console.error('❌ Get Daily Log Failed:', getLog.status, getLog.data);
    failed = true;
  }

  // 5. Test Settings API
  console.log('\n5. Testing Settings API...');
  const settings = await request('/api/settings');
  if (settings.status === 200) {
    console.log('✅ Settings API working');
  } else {
    console.error('❌ Settings API Failed:', settings.status);
    failed = true;
  }

  if (failed) {
    console.error('\n❌ Some tests failed.');
    process.exit(1);
  } else {
    console.log('\n✅ All API tests passed successfully!');
  }
}

runTests();
