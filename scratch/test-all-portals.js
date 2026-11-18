const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const unwrapped = parsed?.data !== undefined ? parsed.data : parsed;
          resolve({ status: res.statusCode, headers: res.headers, data: unwrapped, rawParsed: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log(' E2E VERIFICATION: MULTI-BRANCH SCHOOL ERP PORTAL');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, ok, details = '') {
    total++;
    if (ok) {
      passed++;
      console.log(`[PASS] ${name} ${details ? '(' + details + ')' : ''}`);
    } else {
      console.error(`[FAIL] ${name} - ${details}`);
    }
  }

  // 1. Platform Super Admin Login
  const superRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/platform-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'superadmin@schoolerp.com', password: 'SuperAdmin@123' },
  );
  test(
    '1. Platform Super Admin Login',
    superRes.status === 200 && superRes.data?.user?.role === 'PLATFORM_SUPER_ADMIN',
    `User: ${superRes.data?.user?.name}, redirectUrl: ${superRes.data?.redirectUrl}`,
  );
  const superToken = superRes.data?.accessToken;

  // 1b. Platform Dashboard
  const platDash = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/platform/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${superToken}` },
  });
  test(
    '1b. Platform Dashboard Stats',
    platDash.status === 200 && platDash.data?.totalOrganizations >= 1,
    `Orgs: ${platDash.data?.totalOrganizations}, Branches: ${platDash.data?.totalBranches}, Students: ${platDash.data?.totalStudents}`,
  );

  // 2. Organization Admin Login (Common Login)
  const orgRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'orgadmin@schoolerp.com', password: 'OrgAdmin@123' },
  );
  test(
    '2. Organization Admin Common Login',
    orgRes.status === 200 && orgRes.data?.user?.role === 'ORGANIZATION_ADMIN',
    `User: ${orgRes.data?.user?.name}, Org: ${orgRes.data?.user?.organization?.organizationName}`,
  );
  const orgToken = orgRes.data?.accessToken;

  // 2b. Organization Consolidated Dashboard
  const orgDash = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/admin/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${orgToken}` },
  });
  test(
    '2b. Org Admin Consolidated Overview',
    orgDash.status === 200 && orgDash.data?.scope === 'CONSOLIDATED_ORGANIZATION',
    `Scope: ${orgDash.data?.scope}, Total Branches: ${orgDash.data?.totalBranches}, Overview Students: ${orgDash.data?.overview?.totalStudents}`,
  );

  // 2c. Branch Comparison Matrix
  const comparison = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/admin/branch-comparison',
    method: 'GET',
    headers: { Authorization: `Bearer ${orgToken}` },
  });
  test(
    '2c. Multi-Branch Comparison Matrix',
    comparison.status === 200 && Array.isArray(comparison.data) && comparison.data.length >= 2,
    `Branches compared: ${comparison.data?.map((b) => b.branchName).join(', ')}`,
  );

  // 3. Branch Admin Login (Kochi Campus)
  const kochiRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin.kochi@schoolerp.com', password: 'Admin@123' },
  );
  test(
    '3. Kochi Branch Admin Common Login',
    kochiRes.status === 200 && kochiRes.data?.user?.role === 'BRANCH_ADMIN',
    `Role: ${kochiRes.data?.user?.role}, Primary Branch: ${kochiRes.data?.user?.primaryBranchId}`,
  );
  const kochiToken = kochiRes.data?.accessToken;

  // 3b. Branch Admin Scoped Dashboard
  const kochiDash = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/admin/dashboard?branchId=${kochiRes.data?.user?.primaryBranchId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${kochiToken}` },
  });
  test(
    '3b. Kochi Campus Scoped Dashboard',
    kochiDash.status === 200 && kochiDash.data?.scope === 'BRANCH_SPECIFIC',
    `Branch: ${kochiDash.data?.branch?.branchName}, Scope: ${kochiDash.data?.scope}`,
  );

  // 4. Multi-Branch Teacher Login (Teacher Anjali)
  const teacherRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'anjali.teacher@schoolerp.com', password: 'Teacher@123' },
  );
  test(
    '4. Multi-Branch Teacher Common Login',
    teacherRes.status === 200 && teacherRes.data?.user?.role === 'TEACHER',
    `Teacher: ${teacherRes.data?.user?.name}, redirectUrl: ${teacherRes.data?.redirectUrl}`,
  );
  const teacherToken = teacherRes.data?.accessToken;

  // 4b. Teacher Dashboard with Multi-Branch Assignments
  const teacherDash = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/teacher/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const branchNames = (teacherDash.data?.branchAssignments || []).map((a) => a.branch?.branchName);
  test(
    '4b. Teacher Multi-Branch Assignments Loaded',
    teacherDash.status === 200 && branchNames.length >= 2,
    `Assigned to: ${branchNames.join(' & ')}`,
  );

  // 5. Staff Priya Common Login
  const staffRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'priya.staff@schoolerp.com', password: 'Staff@123' },
  );
  test(
    '5. Staff Member Common Login',
    staffRes.status === 200 && staffRes.data?.user?.role === 'STAFF',
    `Staff: ${staffRes.data?.user?.name}, redirectUrl: ${staffRes.data?.redirectUrl}`,
  );

  // 6. Student Login (Devanand R - Kochi Campus)
  const studentRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/student-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'devanand.student@schoolerp.com', password: 'Student@123' },
  );
  test(
    '6. Student Portal Login',
    studentRes.status === 200 && studentRes.data?.user?.role === 'STUDENT',
    `Student: ${studentRes.data?.user?.name}`,
  );
  const studentToken = studentRes.data?.accessToken;

  // 6b. Student Dashboard with Branch Campus
  const studentDash = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/student/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  test(
    '6b. Student Dashboard & Campus Worksite',
    studentDash.status === 200 && !!studentDash.data?.branch?.branchCode,
    `Campus: ${studentDash.data?.branch?.branchName} (${studentDash.data?.branch?.branchCode}), Class: ${studentDash.data?.assignedClass?.name}`,
  );

  // 7. Transferred Student Login (Arjun S - Transferred to Calicut)
  const transRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/student-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'arjun.student@schoolerp.com', password: 'Student@123' },
  );
  const arjunDash = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/student/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${transRes.data?.accessToken}` },
  });
  test(
    '7. Inter-Branch Transferred Student Verification',
    arjunDash.status === 200 && arjunDash.data?.transferHistory?.length >= 1,
    `Current: ${arjunDash.data?.branch?.branchName}, Transferred From: ${arjunDash.data?.transferHistory?.[0]?.fromBranch?.branchName}`,
  );

  // 8. Parent Portal Login (Ravi Parent)
  const parentRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/parent-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'ravi.parent@schoolerp.com', password: 'Parent@123' },
  );
  test(
    '8. Parent Portal Login',
    parentRes.status === 200 && parentRes.data?.user?.role === 'PARENT',
    `Parent: ${parentRes.data?.user?.name}`,
  );
  const parentToken = parentRes.data?.accessToken;

  // 8b. Parent Dashboard with Linked Child
  const parentDash = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/parent/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${parentToken}` },
  });
  const linkedChild = parentDash.data?.children?.[0];
  test(
    '8b. Parent Dashboard Linked Child',
    parentDash.status === 200 && linkedChild?.user?.name === 'Devanand R',
    `Child: ${linkedChild?.user?.name}, Campus: ${linkedChild?.branch?.branchName}, AdmNo: ${linkedChild?.admissionNumber}`,
  );

  // 9. Timetable Conflict Prevention Test
  // Attempt to schedule Period 1 on Monday for Class 8A which already has Mathematics
  const classObj = studentDash.data?.assignedClass;
  const kochiBranchId = studentDash.data?.branch?.id;
  const mathSubject = classObj?.subjects?.[0];
  const teacherAssignment = teacherDash.data?.branchAssignments?.[0];

  if (classObj && kochiBranchId && mathSubject && teacherAssignment) {
    const conflictRes = await request(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/academics/timetable/periods',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${orgToken}`,
        },
      },
      {
        branchId: kochiBranchId,
        classId: classObj.id,
        subjectId: mathSubject.id,
        teacherId: teacherAssignment.id,
        dayOfWeek: 'Monday',
        periodNumber: 1, // Already occupied by Mathematics in Class 8A in seed!
        startTime: '09:00 AM',
        endTime: '09:45 AM',
      },
    );
    test(
      '9. Automated Timetable Conflict Prevention (409 Conflict)',
      conflictRes.status === 409,
      `Status: ${conflictRes.status}, Message: ${conflictRes.rawParsed?.message || conflictRes.data?.message}`,
    );
  }

  // 10. Frontend HTTP 200 Checks (Next.js port 3000)
  const feHome = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
  });
  test('10a. Frontend Landing Page (HTTP 200)', feHome.status === 200, 'Port 3000 Online');

  const feLogin = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/login',
    method: 'GET',
  });
  test('10b. Frontend Common Login Page (HTTP 200)', feLogin.status === 200, 'Port 3000 Online');

  const feTeacher = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/teacher/dashboard',
    method: 'GET',
  });
  test('10c. Frontend Teacher Dashboard (HTTP 200)', feTeacher.status === 200, 'Port 3000 Online');

  const feParent = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/parent/dashboard',
    method: 'GET',
  });
  test('10d. Frontend Parent Dashboard (HTTP 200)', feParent.status === 200, 'Port 3000 Online');

  const fePayroll = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/payroll',
    method: 'GET',
  });
  test('10e. Frontend Admin Payroll Page (HTTP 200)', fePayroll.status === 200, 'Port 3000 Online');

  const feFees = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/fees',
    method: 'GET',
  });
  test('10f. Frontend Admin Fees Page (HTTP 200)', feFees.status === 200, 'Port 3000 Online');

  console.log(`\n====================================================`);
  console.log(` SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log(`====================================================`);
}

run().catch(console.error);
