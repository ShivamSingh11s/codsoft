const http = require('http');
const path = require('path');
const fs = require('fs');

// Set test env
process.env.NODE_ENV = 'test';
process.env.PORT = 5001;

// Use temporary DB for test run
const testDbPath = path.join(__dirname, 'test_database.sqlite');
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
process.env.DB_PATH = testDbPath;

const { connectDB } = require('./src/config/database');
const app = require('./server');

let server;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, body: json });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Automated API Verification Test Suite...\n');
  await connectDB();

  server = app.listen(5001);

  let passed = 0;
  let failed = 0;
  let createdContactId1 = null;
  let createdContactId2 = null;

  async function assert(description, fn) {
    try {
      await fn();
      console.log(` ✅ PASS: ${description}`);
      passed++;
    } catch (err) {
      console.error(` ❌ FAIL: ${description}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Healthcheck
  await assert('GET /api/health returns 200 OK', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/health',
      method: 'GET',
    });
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Expected 200 OK, got ${res.status}`);
    }
  });

  // 2. Create Contact 1
  await assert('POST /api/contacts creates contact record (201 Created)', async () => {
    const payload = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0199',
      address: '123 Main Street',
      company: 'Acme Corp',
    };
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 5001,
        path: '/api/contacts',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      payload
    );
    if (res.status !== 201 || !res.body.success) {
      throw new Error(`Expected 201 Created, got ${res.status} (${JSON.stringify(res.body)})`);
    }
    createdContactId1 = res.body.data.id;
  });

  // 3. Create Contact 2
  await assert('POST /api/contacts creates second contact (201 Created)', async () => {
    const payload = {
      name: 'Alice Smith',
      email: 'alice.smith@tech.org',
      phone: '+1-555-0288',
      address: '456 Tech Park',
      company: 'Beta Systems',
    };
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 5001,
        path: '/api/contacts',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      payload
    );
    if (res.status !== 201 || !res.body.success) {
      throw new Error(`Expected 201 Created, got ${res.status}`);
    }
    createdContactId2 = res.body.data.id;
  });

  // 4. Duplicate Email Prevention
  await assert('POST /api/contacts prevents duplicate email entry (409 Conflict)', async () => {
    const payload = {
      name: 'John Clone',
      email: 'john.doe@example.com',
      phone: '+1-555-9999',
    };
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 5001,
        path: '/api/contacts',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      payload
    );
    if (res.status !== 409 || res.body.success !== false) {
      throw new Error(`Expected 409 Conflict, got ${res.status}`);
    }
  });

  // 5. Duplicate Phone Prevention
  await assert('POST /api/contacts prevents duplicate phone entry (409 Conflict)', async () => {
    const payload = {
      name: 'Phone Clone',
      email: 'unique.email@example.com',
      phone: '+1-555-0199',
    };
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 5001,
        path: '/api/contacts',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      payload
    );
    if (res.status !== 409 || res.body.success !== false) {
      throw new Error(`Expected 409 Conflict, got ${res.status}`);
    }
  });

  // 6. Validation Error on invalid payload
  await assert('POST /api/contacts validates invalid email format (400 Bad Request)', async () => {
    const payload = {
      name: 'Invalid Email User',
      email: 'not-an-email',
      phone: '12345',
    };
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 5001,
        path: '/api/contacts',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      payload
    );
    if (res.status !== 400 || res.body.success !== false) {
      throw new Error(`Expected 400 Bad Request, got ${res.status}`);
    }
  });

  // 7. Get All Contacts
  await assert('GET /api/contacts retrieves contact list with metadata', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/contacts',
      method: 'GET',
    });
    if (res.status !== 200 || res.body.meta.totalItems !== 2) {
      throw new Error(`Expected totalItems=2, got ${res.body.meta.totalItems}`);
    }
  });

  // 8. Search Functionality
  await assert('GET /api/contacts?search=John filters contacts correctly', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/contacts?search=John',
      method: 'GET',
    });
    if (res.status !== 200 || res.body.data.length !== 1 || res.body.data[0].name !== 'John Doe') {
      throw new Error(`Expected 1 match ('John Doe'), got ${res.body.data.length}`);
    }
  });

  // 9. Sorting
  await assert('GET /api/contacts?sortBy=name&sortOrder=ASC sorts alphabetically', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/contacts?sortBy=name&sortOrder=ASC',
      method: 'GET',
    });
    if (res.status !== 200 || res.body.data[0].name !== 'Alice Smith') {
      throw new Error(`Expected first contact to be 'Alice Smith', got ${res.body.data[0]?.name}`);
    }
  });

  // 10. Pagination
  await assert('GET /api/contacts?page=1&limit=1 paginates properly', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/contacts?page=1&limit=1',
      method: 'GET',
    });
    if (res.status !== 200 || res.body.data.length !== 1 || res.body.meta.totalPages !== 2) {
      throw new Error(`Expected 1 item per page & 2 total pages, got ${res.body.meta.totalPages}`);
    }
  });

  // 11. Update Contact
  await assert('PUT /api/contacts/:id updates existing contact', async () => {
    const payload = { company: 'Acme International LLC' };
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 5001,
        path: `/api/contacts/${createdContactId1}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      },
      payload
    );
    if (res.status !== 200 || res.body.data.company !== 'Acme International LLC') {
      throw new Error(`Update failed, got ${JSON.stringify(res.body)}`);
    }
  });

  // 12. Delete Contact
  await assert('DELETE /api/contacts/:id removes contact', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: `/api/contacts/${createdContactId2}`,
      method: 'DELETE',
    });
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Delete failed, got status ${res.status}`);
    }
  });

  console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed.`);

  server.close();
  const { sequelize } = require('./src/config/database');
  await sequelize.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  if (server) server.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  process.exit(1);
});
