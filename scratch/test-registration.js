async function testRegistration() {
  const url = 'http://localhost:3001/auth/register';
  const payload = {
    name: 'AMAL M B',
    email: `amal.test.${Date.now()}@gmail.com`,
    phone: '+919961989578',
    password: 'Password123!',
    branchId: 'branch-calicut-002', // The exact dummy ID that was failing in the screenshot!
    admissionClass: 'Class 11 (Senior Sec)',
    gender: 'Male', // Title case as shown in the screenshot!
    address: 'Calicut, Kerala',
  };

  console.log('Sending registration request with:', payload);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    // Also test GET /branches/public
    const branchesRes = await fetch('http://localhost:3001/branches/public');
    const branchesData = await branchesRes.json();
    console.log(`\nGET /branches/public status: ${branchesRes.status}`);
    console.log('Public branches count:', Array.isArray(branchesData) ? branchesData.length : branchesData?.data?.length);
    console.log('Public branches sample:', JSON.stringify(branchesData, null, 2).substring(0, 300));
  } catch (err) {
    console.error('❌ Request error:', err.message);
  }
}

testRegistration();
