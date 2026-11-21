const http = require('http');

const BASE_URL = 'http://127.0.0.1:4000';

function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const reqOptions = {
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = http.request(url, reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: json, raw: data });
                } catch (e) {
                    resolve({ status: res.statusCode, data: null, raw: data });
                }
            });
        });

        req.on('error', reject);
        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }
        req.end();
    });
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ ASSERTION FAILED: ${message}`);
        process.exit(1);
    } else {
        console.log(`  ✓ ${message}`);
    }
}

async function runTestCycle(cycleNumber, clientASuffix, clientBSuffix) {
    console.log(`\n======================================================`);
    console.log(`  STARTING COMPLETE TEST CYCLE #${cycleNumber}`);
    console.log(`======================================================\n`);

    const emailA = `apex_${clientASuffix}_${Date.now()}@test.com`;
    const emailB = `metro_${clientBSuffix}_${Date.now()}@test.com`;

    // 1. Signup Client A
    console.log(`[1] Registering Client A: Apex Mobile Store (${emailA})...`);
    const signupA = await request('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
            shopName: 'Apex Mobile Store',
            ownerName: 'Rajesh Sharma',
            phone: '9876543210',
            email: emailA,
            password: 'password123'
        }
    });
    assert(signupA.status === 201, `Client A Signup returns HTTP 201 Created (got ${signupA.status})`);
    assert(signupA.data.token, `Client A receives JWT token`);
    assert(signupA.data.user.tenantCode, `Client A receives unique Shop Code: ${signupA.data.user.tenantCode}`);
    const tokenA = signupA.data.token;
    const userA = signupA.data.user;

    // 2. Signup Client B
    console.log(`\n[2] Registering Client B: Metro Cellular (${emailB})...`);
    const signupB = await request('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
            shopName: 'Metro Cellular',
            ownerName: 'Amit Patel',
            phone: '9988776655',
            email: emailB,
            password: 'password456'
        }
    });
    assert(signupB.status === 201, `Client B Signup returns HTTP 201 Created (got ${signupB.status})`);
    assert(signupB.data.token, `Client B receives JWT token`);
    assert(signupB.data.user.tenantCode, `Client B receives unique Shop Code: ${signupB.data.user.tenantCode}`);
    const tokenB = signupB.data.token;
    const userB = signupB.data.user;

    assert(userA.id !== userB.id, `Tenant IDs are strictly isolated (${userA.id} != ${userB.id})`);
    assert(userA.tenantCode !== userB.tenantCode, `Tenant Codes are strictly unique (${userA.tenantCode} != ${userB.tenantCode})`);

    // 3. Login Verification
    console.log(`\n[3] Verifying Login for Client A and Client B...`);
    const loginA = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { email: emailA, password: 'password123' }
    });
    assert(loginA.status === 200, `Client A Login successful (HTTP 200)`);

    const loginB = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { email: emailB, password: 'password456' }
    });
    assert(loginB.status === 200, `Client B Login successful (HTTP 200)`);

    // 4. Me Endpoint Verification
    console.log(`\n[4] Verifying /api/auth/me token decoding...`);
    const meA = await request('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(meA.status === 200 && meA.data.user.shopName === 'Apex Mobile Store', `Token A identifies Apex Mobile Store`);

    const meB = await request('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert(meB.status === 200 && meB.data.user.shopName === 'Metro Cellular', `Token B identifies Metro Cellular`);

    // 5. Dynamic Provisioning QR Payload
    console.log(`\n[5] Testing Provisioning QR generation per Tenant...`);
    const qrA = await request(`/api/provisioning-payload?tenantCode=${userA.tenantCode}`);
    assert(qrA.data.payload['android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE'].tenantCode === userA.tenantCode,
        `QR payload A contains Client A's Shop Code: ${userA.tenantCode}`);

    const qrB = await request(`/api/provisioning-payload?tenantCode=${userB.tenantCode}`);
    assert(qrB.data.payload['android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE'].tenantCode === userB.tenantCode,
        `QR payload B contains Client B's Shop Code: ${userB.tenantCode}`);

    // 6. Device Enrollment under Tenant A & Tenant B
    console.log(`\n[6] Enrolling handsets with Dual-IMEI tracking...`);
    const devIdA = `test_handset_apex_${clientASuffix}`;
    const devIdB = `test_handset_metro_${clientBSuffix}`;
    const imeiA = '860123456789012';
    const imeiB = '860987654321098';

    const enrollA = await request('/api/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
            deviceId: devIdA,
            tenantCode: userA.tenantCode,
            brand: 'itel',
            model: 'itel C672N',
            battery: 95,
            androidVersion: '14',
            status: 'NORMAL',
            customerName: 'Ramesh Kumar',
            customerPhone: '9876543210',
            enteredImei: imeiA,
            hardwareImei: imeiA,
            loanId: 'LN-APEX-101',
            emiAmount: '2200'
        }
    });
    assert(enrollA.status === 200, `Device A enrolled successfully`);
    assert(enrollA.data.device.tenantId === userA.id, `Device A strictly bound to Tenant A (${userA.id})`);
    assert(enrollA.data.device.imeiVerified === true, `Device A IMEI Dual-Verification MATCH confirmed`);

    const enrollB = await request('/api/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
            deviceId: devIdB,
            tenantCode: userB.tenantCode,
            brand: 'Realme',
            model: 'Realme 12',
            battery: 88,
            androidVersion: '14',
            status: 'NORMAL',
            customerName: 'Suresh Verma',
            customerPhone: '9988776655',
            enteredImei: imeiB,
            hardwareImei: imeiB,
            loanId: 'LN-METRO-202',
            emiAmount: '3500'
        }
    });
    assert(enrollB.status === 200, `Device B enrolled successfully`);
    assert(enrollB.data.device.tenantId === userB.id, `Device B strictly bound to Tenant B (${userB.id})`);
    assert(enrollB.data.device.imeiVerified === true, `Device B IMEI Dual-Verification MATCH confirmed`);

    // 7. Strict Multi-Tenant Isolation Checks
    console.log(`\n[7] Verifying Strict Multi-Tenant Data Isolation...`);
    const listA = await request('/api/devices', {
        headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(listA.status === 200, `Client A can query fleet list`);
    assert(listA.data[devIdA] !== undefined, `Client A sees Device A (${devIdA})`);
    assert(listA.data[devIdB] === undefined, `CRITICAL SECURITY: Client A CANNOT see Client B's device (${devIdB})!`);

    const listB = await request('/api/devices', {
        headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert(listB.status === 200, `Client B can query fleet list`);
    assert(listB.data[devIdB] !== undefined, `Client B sees Device B (${devIdB})`);
    assert(listB.data[devIdA] === undefined, `CRITICAL SECURITY: Client B CANNOT see Client A's device (${devIdA})!`);

    // 8. Cross-Tenant Command Protection
    console.log(`\n[8] Testing Cross-Tenant Command Authorization...`);
    // Client A attempts to command Client B's device -> MUST FAIL
    const crossCommand = await request(`/api/devices/${devIdB}/command`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenA}`
        },
        body: { command: 'LOCK' }
    });
    assert(crossCommand.status === 403, `CRITICAL SECURITY: Client A commanding Client B's device returns HTTP 403 Forbidden!`);

    // Client A commands its own device -> MUST SUCCEED
    const ownCommandA = await request(`/api/devices/${devIdA}/command`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenA}`
        },
        body: { command: 'LOCK' }
    });
    assert(ownCommandA.status === 200, `Client A successfully locks own device (${devIdA})`);

    // Client B commands its own device -> MUST SUCCEED
    const ownCommandB = await request(`/api/devices/${devIdB}/command`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenB}`
        },
        body: { command: 'LOCK' }
    });
    assert(ownCommandB.status === 200, `Client B successfully locks own device (${devIdB})`);

    console.log(`\n  ✅ TEST CYCLE #${cycleNumber} COMPLETED WITH 100% SUCCESS!\n`);
}

async function main() {
    try {
        console.log('Testing server connectivity...');
        const health = await request('/api/provisioning-payload');
        assert(health.status === 200, 'Server is running and responsive');

        // RUN 1: Complete Test
        await runTestCycle(1, 'run1_a', 'run1_b');

        // RUN 2: Complete Second Test (Double Verification)
        await runTestCycle(2, 'run2_c', 'run2_d');

        console.log('======================================================');
        console.log('  🎉 BOTH VERIFICATION TEST CYCLES PASSED 100%!       ');
        console.log('======================================================\n');
        process.exit(0);
    } catch (err) {
        console.error('Test failed with error:', err);
        process.exit(1);
    }
}

main();
