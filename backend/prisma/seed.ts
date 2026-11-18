import {
  PrismaClient,
  Role,
  AccountStatus,
  BranchStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  OrganizationStatus,
  EmploymentType,
  AttendanceStatus,
  LeaveStatus,
  PaymentStatus,
  AnnouncementTarget,
  Gender,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Multi-Tenant, Multi-Branch School ERP database...');

  const defaultPassword = await bcrypt.hash('School@123456', 10);
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
  const orgAdminPassword = await bcrypt.hash('OrgAdmin@123', 10);
  const branchAdminPassword = await bcrypt.hash('Admin@123', 10);
  const teacherPassword = await bcrypt.hash('Teacher@123', 10);
  const staffPassword = await bcrypt.hash('Staff@123', 10);
  const studentPassword = await bcrypt.hash('Student@123', 10);
  const parentPassword = await bcrypt.hash('Parent@123', 10);

  // 1. Create Platform Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@schoolerp.com' },
    update: {},
    create: {
      name: 'Global Platform Super Admin',
      email: 'superadmin@schoolerp.com',
      password: superAdminPassword,
      phone: '+91 98400 11223',
      role: Role.PLATFORM_SUPER_ADMIN,
      status: AccountStatus.APPROVED,
    },
  });
  console.log(`✓ Super Admin created: ${superAdmin.email}`);

  // 2. Create School Organization
  const organization = await prisma.organization.upsert({
    where: { organizationCode: 'NPAG' },
    update: {},
    create: {
      organizationName: 'National Public Academy Group',
      organizationCode: 'NPAG',
      logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
      contactEmail: 'central@npag-academy.edu',
      contactPhone: '+91 484 288 9000',
      address: 'Central Corporate Tower, MG Road',
      district: 'Ernakulam',
      state: 'Kerala',
      country: 'India',
      website: 'https://npag-academy.edu',
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      organizationStatus: OrganizationStatus.ACTIVE,
      academicYear: '2026-2027',
    },
  });
  console.log(`✓ Organization created: ${organization.organizationName} (${organization.organizationCode})`);

  // 3. Create Organization Admin User
  const orgAdmin = await prisma.user.upsert({
    where: { email: 'orgadmin@schoolerp.com' },
    update: {},
    create: {
      name: 'Dr. Ramachandran Menon',
      email: 'orgadmin@schoolerp.com',
      password: orgAdminPassword,
      phone: '+91 94470 12345',
      role: Role.ORGANIZATION_ADMIN,
      status: AccountStatus.APPROVED,
      organizationId: organization.id,
    },
  });
  console.log(`✓ Organization Admin created: ${orgAdmin.email}`);

  // 4. Create 3 Branches under NPAG
  const kochiBranch = await prisma.branch.upsert({
    where: {
      organizationId_branchCode: {
        organizationId: organization.id,
        branchCode: 'NPAG-KCH',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      branchName: 'Kochi Central Campus',
      branchCode: 'NPAG-KCH',
      address: 'Panampilly Nagar Academic Block, Kochi',
      district: 'Ernakulam',
      state: 'Kerala',
      country: 'India',
      phone: '+91 484 233 4455',
      email: 'kochi.campus@npag-academy.edu',
      academicYear: '2026-2027',
      status: BranchStatus.ACTIVE,
    },
  });

  const calicutBranch = await prisma.branch.upsert({
    where: {
      organizationId_branchCode: {
        organizationId: organization.id,
        branchCode: 'NPAG-CLT',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      branchName: 'Calicut Heritage Branch',
      branchCode: 'NPAG-CLT',
      address: 'Wayanad Road, East Hill, Calicut',
      district: 'Kozhikode',
      state: 'Kerala',
      country: 'India',
      phone: '+91 495 244 5566',
      email: 'calicut.branch@npag-academy.edu',
      academicYear: '2026-2027',
      status: BranchStatus.ACTIVE,
    },
  });

  const malappuramBranch = await prisma.branch.upsert({
    where: {
      organizationId_branchCode: {
        organizationId: organization.id,
        branchCode: 'NPAG-MLP',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      branchName: 'Malappuram Tech Campus',
      branchCode: 'NPAG-MLP',
      address: 'Down Hill Techno Valley, Malappuram',
      district: 'Malappuram',
      state: 'Kerala',
      country: 'India',
      phone: '+91 483 255 6677',
      email: 'malappuram.campus@npag-academy.edu',
      academicYear: '2026-2027',
      status: BranchStatus.ACTIVE,
    },
  });
  console.log(`✓ 3 Branches created: Kochi, Calicut, Malappuram`);

  // 5. Create Branch Admins & assign to branches
  const kochiAdmin = await prisma.user.upsert({
    where: { email: 'admin.kochi@schoolerp.com' },
    update: {},
    create: {
      name: 'Venugopal S (Kochi Principal)',
      email: 'admin.kochi@schoolerp.com',
      password: branchAdminPassword,
      phone: '+91 94471 22334',
      role: Role.BRANCH_ADMIN,
      status: AccountStatus.APPROVED,
      organizationId: organization.id,
      primaryBranchId: kochiBranch.id,
    },
  });

  const calicutAdmin = await prisma.user.upsert({
    where: { email: 'admin.calicut@schoolerp.com' },
    update: {},
    create: {
      name: 'Fathima Zahra (Calicut Principal)',
      email: 'admin.calicut@schoolerp.com',
      password: branchAdminPassword,
      phone: '+91 94472 33445',
      role: Role.BRANCH_ADMIN,
      status: AccountStatus.APPROVED,
      organizationId: organization.id,
      primaryBranchId: calicutBranch.id,
    },
  });

  // Update Branch Admin relations
  await prisma.branch.update({
    where: { id: kochiBranch.id },
    data: { branchAdminId: kochiAdmin.id },
  });
  await prisma.branch.update({
    where: { id: calicutBranch.id },
    data: { branchAdminId: calicutAdmin.id },
  });

  // Create Branch Memberships for Admins
  await prisma.branchMembership.upsert({
    where: { userId_branchId: { userId: kochiAdmin.id, branchId: kochiBranch.id } },
    update: {},
    create: {
      userId: kochiAdmin.id,
      branchId: kochiBranch.id,
      isPrimary: true,
      role: Role.BRANCH_ADMIN,
    },
  });
  await prisma.branchMembership.upsert({
    where: { userId_branchId: { userId: calicutAdmin.id, branchId: calicutBranch.id } },
    update: {},
    create: {
      userId: calicutAdmin.id,
      branchId: calicutBranch.id,
      isPrimary: true,
      role: Role.BRANCH_ADMIN,
    },
  });

  // 6. Create Departments
  const mathDept = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Mathematics & Computing' } },
    update: {},
    create: { organizationId: organization.id, name: 'Mathematics & Computing', code: 'MATH' },
  });

  const scienceDept = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Natural Sciences' } },
    update: {},
    create: { organizationId: organization.id, name: 'Natural Sciences', code: 'SCI' },
  });

  const adminDept = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Administration & Finance' } },
    update: {},
    create: { organizationId: organization.id, name: 'Administration & Finance', code: 'ADM' },
  });

  // 7. Multi-Branch Teacher: Anjali K (Assigned to BOTH Kochi & Calicut)
  const anjaliTeacher = await prisma.user.upsert({
    where: { email: 'anjali.teacher@schoolerp.com' },
    update: {},
    create: {
      name: 'Anjali K',
      email: 'anjali.teacher@schoolerp.com',
      password: teacherPassword,
      phone: '+91 98950 12345',
      role: Role.TEACHER,
      status: AccountStatus.APPROVED,
      organizationId: organization.id,
      primaryBranchId: kochiBranch.id,
    },
  });

  // Memberships for Anjali K in both branches
  await prisma.branchMembership.upsert({
    where: { userId_branchId: { userId: anjaliTeacher.id, branchId: kochiBranch.id } },
    update: {},
    create: {
      userId: anjaliTeacher.id,
      branchId: kochiBranch.id,
      isPrimary: true,
      role: Role.TEACHER,
    },
  });
  await prisma.branchMembership.upsert({
    where: { userId_branchId: { userId: anjaliTeacher.id, branchId: calicutBranch.id } },
    update: {},
    create: {
      userId: anjaliTeacher.id,
      branchId: calicutBranch.id,
      isPrimary: false,
      role: Role.TEACHER,
    },
  });

  // Employee Branch Assignments for Anjali K
  const anjaliKochiAssignment = await prisma.employeeBranchAssignment.upsert({
    where: { branchId_employeeId: { branchId: kochiBranch.id, employeeId: 'EMP-KCH-T01' } },
    update: {},
    create: {
      userId: anjaliTeacher.id,
      branchId: kochiBranch.id,
      employeeId: 'EMP-KCH-T01',
      departmentId: mathDept.id,
      designation: 'Senior Mathematics Teacher',
      employmentType: EmploymentType.FULL_TIME,
      isPrimary: true,
      basicSalary: 28000,
      houseAllowance: 5000,
      otherAllowance: 3000,
      bankAccount: '918237465012',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
    },
  });

  const anjaliCalicutAssignment = await prisma.employeeBranchAssignment.upsert({
    where: { branchId_employeeId: { branchId: calicutBranch.id, employeeId: 'EMP-CLT-T01' } },
    update: {},
    create: {
      userId: anjaliTeacher.id,
      branchId: calicutBranch.id,
      employeeId: 'EMP-CLT-T01',
      departmentId: mathDept.id,
      designation: 'Visiting Senior Mathematics Faculty',
      employmentType: EmploymentType.PART_TIME,
      isPrimary: false,
      basicSalary: 22000,
      houseAllowance: 3000,
      otherAllowance: 2000,
      bankAccount: '918237465012',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
    },
  });
  console.log(`✓ Multi-Branch Teacher created: Anjali K (Kochi + Calicut assignments)`);

  // 8. Other Teachers & Staff
  const rajeshTeacher = await prisma.user.upsert({
    where: { email: 'rajesh.teacher@schoolerp.com' },
    update: {},
    create: {
      name: 'Rajesh Menon',
      email: 'rajesh.teacher@schoolerp.com',
      password: teacherPassword,
      phone: '+91 98951 23456',
      role: Role.TEACHER,
      status: AccountStatus.APPROVED,
      organizationId: organization.id,
      primaryBranchId: kochiBranch.id,
    },
  });
  await prisma.branchMembership.upsert({
    where: { userId_branchId: { userId: rajeshTeacher.id, branchId: kochiBranch.id } },
    update: {},
    create: { userId: rajeshTeacher.id, branchId: kochiBranch.id, isPrimary: true, role: Role.TEACHER },
  });
  const rajeshAssignment = await prisma.employeeBranchAssignment.upsert({
    where: { branchId_employeeId: { branchId: kochiBranch.id, employeeId: 'EMP-KCH-T02' } },
    update: {},
    create: {
      userId: rajeshTeacher.id,
      branchId: kochiBranch.id,
      employeeId: 'EMP-KCH-T02',
      departmentId: scienceDept.id,
      designation: 'Head of Physics & Sciences',
      basicSalary: 30000,
      houseAllowance: 5500,
      otherAllowance: 3500,
    },
  });

  const priyaStaff = await prisma.user.upsert({
    where: { email: 'priya.staff@schoolerp.com' },
    update: {},
    create: {
      name: 'Priya Nair',
      email: 'priya.staff@schoolerp.com',
      password: staffPassword,
      phone: '+91 98952 34567',
      role: Role.STAFF,
      status: AccountStatus.APPROVED,
      organizationId: organization.id,
      primaryBranchId: kochiBranch.id,
    },
  });
  await prisma.branchMembership.upsert({
    where: { userId_branchId: { userId: priyaStaff.id, branchId: kochiBranch.id } },
    update: {},
    create: { userId: priyaStaff.id, branchId: kochiBranch.id, isPrimary: true, role: Role.STAFF },
  });
  await prisma.employeeBranchAssignment.upsert({
    where: { branchId_employeeId: { branchId: kochiBranch.id, employeeId: 'EMP-KCH-S01' } },
    update: {},
    create: {
      userId: priyaStaff.id,
      branchId: kochiBranch.id,
      employeeId: 'EMP-KCH-S01',
      departmentId: adminDept.id,
      designation: 'Senior Accountant & Fee Coordinator',
      basicSalary: 24000,
      houseAllowance: 4000,
      otherAllowance: 2000,
    },
  });

  // 9. Classes in Kochi & Calicut
  const kochiClass8A = await prisma.class.upsert({
    where: {
      branchId_name_section_academicYear: {
        branchId: kochiBranch.id,
        name: 'Class 8',
        section: 'A',
        academicYear: '2026-2027',
      },
    },
    update: {},
    create: {
      branchId: kochiBranch.id,
      name: 'Class 8',
      section: 'A',
      roomNumber: 'Room 201',
      academicYear: '2026-2027',
      capacity: 35,
    },
  });

  const kochiClass8B = await prisma.class.upsert({
    where: {
      branchId_name_section_academicYear: {
        branchId: kochiBranch.id,
        name: 'Class 8',
        section: 'B',
        academicYear: '2026-2027',
      },
    },
    update: {},
    create: {
      branchId: kochiBranch.id,
      name: 'Class 8',
      section: 'B',
      roomNumber: 'Room 202',
      academicYear: '2026-2027',
      capacity: 35,
    },
  });

  const calicutClass9B = await prisma.class.upsert({
    where: {
      branchId_name_section_academicYear: {
        branchId: calicutBranch.id,
        name: 'Class 9',
        section: 'B',
        academicYear: '2026-2027',
      },
    },
    update: {},
    create: {
      branchId: calicutBranch.id,
      name: 'Class 9',
      section: 'B',
      roomNumber: 'Block C-104',
      academicYear: '2026-2027',
      capacity: 30,
    },
  });
  console.log(`✓ Classes created: Kochi Class 8A, 8B & Calicut Class 9B`);

  // 10. Subjects & Teacher Assignments
  const kochiMathSubject = await prisma.subject.upsert({
    where: { classId_name: { classId: kochiClass8A.id, name: 'Mathematics' } },
    update: {},
    create: { classId: kochiClass8A.id, name: 'Mathematics', code: 'MTH-801', totalMarks: 100, passMarks: 40 },
  });

  const kochiScienceSubject = await prisma.subject.upsert({
    where: { classId_name: { classId: kochiClass8A.id, name: 'Physical Science' } },
    update: {},
    create: { classId: kochiClass8A.id, name: 'Physical Science', code: 'SCI-801', totalMarks: 100, passMarks: 40 },
  });

  const calicutMathSubject = await prisma.subject.upsert({
    where: { classId_name: { classId: calicutClass9B.id, name: 'Mathematics' } },
    update: {},
    create: { classId: calicutClass9B.id, name: 'Mathematics', code: 'MTH-902', totalMarks: 100, passMarks: 40 },
  });

  // Assign Anjali K to Kochi Class 8A (Mathematics)
  await prisma.teacherAssignment.upsert({
    where: {
      assignmentId_classId_subjectId: {
        assignmentId: anjaliKochiAssignment.id,
        classId: kochiClass8A.id,
        subjectId: kochiMathSubject.id,
      },
    },
    update: {},
    create: {
      assignmentId: anjaliKochiAssignment.id,
      classId: kochiClass8A.id,
      subjectId: kochiMathSubject.id,
      isClassTeacher: true,
    },
  });

  // Assign Rajesh Menon to Kochi Class 8A (Physical Science)
  await prisma.teacherAssignment.upsert({
    where: {
      assignmentId_classId_subjectId: {
        assignmentId: rajeshAssignment.id,
        classId: kochiClass8A.id,
        subjectId: kochiScienceSubject.id,
      },
    },
    update: {},
    create: {
      assignmentId: rajeshAssignment.id,
      classId: kochiClass8A.id,
      subjectId: kochiScienceSubject.id,
      isClassTeacher: false,
    },
  });

  // Assign Anjali K to Calicut Class 9B (Mathematics)
  await prisma.teacherAssignment.upsert({
    where: {
      assignmentId_classId_subjectId: {
        assignmentId: anjaliCalicutAssignment.id,
        classId: calicutClass9B.id,
        subjectId: calicutMathSubject.id,
      },
    },
    update: {},
    create: {
      assignmentId: anjaliCalicutAssignment.id,
      classId: calicutClass9B.id,
      subjectId: calicutMathSubject.id,
      isClassTeacher: false,
    },
  });

  // 11. Timetable Periods (with conflict protection)
  // Anjali K teaches Monday Period 1 in Kochi Class 8A
  await prisma.timetablePeriod.upsert({
    where: {
      teacherId_dayOfWeek_periodNumber: {
        teacherId: anjaliKochiAssignment.id,
        dayOfWeek: 'Monday',
        periodNumber: 1,
      },
    },
    update: {},
    create: {
      branchId: kochiBranch.id,
      classId: kochiClass8A.id,
      subjectId: kochiMathSubject.id,
      teacherId: anjaliKochiAssignment.id,
      dayOfWeek: 'Monday',
      periodNumber: 1,
      startTime: '09:30 AM',
      endTime: '10:15 AM',
      roomNumber: 'Room 201',
    },
  });

  // Rajesh Menon teaches Monday Period 2 in Kochi Class 8A
  await prisma.timetablePeriod.upsert({
    where: {
      teacherId_dayOfWeek_periodNumber: {
        teacherId: rajeshAssignment.id,
        dayOfWeek: 'Monday',
        periodNumber: 2,
      },
    },
    update: {},
    create: {
      branchId: kochiBranch.id,
      classId: kochiClass8A.id,
      subjectId: kochiScienceSubject.id,
      teacherId: rajeshAssignment.id,
      dayOfWeek: 'Monday',
      periodNumber: 2,
      startTime: '10:20 AM',
      endTime: '11:05 AM',
      roomNumber: 'Room 201',
    },
  });

  // Anjali K teaches Tuesday Period 1 in Calicut Class 9B
  await prisma.timetablePeriod.upsert({
    where: {
      teacherId_dayOfWeek_periodNumber: {
        teacherId: anjaliCalicutAssignment.id,
        dayOfWeek: 'Tuesday',
        periodNumber: 1,
      },
    },
    update: {},
    create: {
      branchId: calicutBranch.id,
      classId: calicutClass9B.id,
      subjectId: calicutMathSubject.id,
      teacherId: anjaliCalicutAssignment.id,
      dayOfWeek: 'Tuesday',
      periodNumber: 1,
      startTime: '09:30 AM',
      endTime: '10:15 AM',
      roomNumber: 'Block C-104',
    },
  });
  console.log(`✓ Timetables & subjects configured for Kochi & Calicut`);

  // 12. Students & Admissions
  // Student 1: Devanand R at Kochi Central
  const devanandUser = await prisma.user.upsert({
    where: { email: 'devanand.student@schoolerp.com' },
    update: {},
    create: {
      name: 'Devanand R',
      email: 'devanand.student@schoolerp.com',
      password: studentPassword,
      phone: '+91 97450 11223',
      role: Role.STUDENT,
      status: AccountStatus.APPROVED,
      organizationId: organization.id,
      primaryBranchId: kochiBranch.id,
    },
  });
  const devanandProfile = await prisma.studentProfile.upsert({
    where: { userId: devanandUser.id },
    update: {},
    create: {
      userId: devanandUser.id,
      branchId: kochiBranch.id,
      admissionNumber: 'ADM-KCH-2026-001',
      studentIdNumber: 'STU-KCH-801',
      dateOfBirth: new Date('2012-05-14'),
      gender: Gender.MALE,
      address: 'Skyline Riverside Apt 4B, Panampilly Nagar, Kochi',
      emergencyPhone: '+91 98470 55667',
      admissionClass: 'Class 8',
      classId: kochiClass8A.id,
    },
  });

  // Student 2: Meera Krishnan at Calicut
  const meeraUser = await prisma.user.upsert({
    where: { email: 'meera.student@schoolerp.com' },
    update: {},
    create: {
      name: 'Meera Krishnan',
      email: 'meera.student@schoolerp.com',
      password: studentPassword,
      phone: '+91 97450 22334',
      role: Role.STUDENT,
      status: AccountStatus.APPROVED,
      organizationId: organization.id,
      primaryBranchId: calicutBranch.id,
    },
  });
  const meeraProfile = await prisma.studentProfile.upsert({
    where: { userId: meeraUser.id },
    update: {},
    create: {
      userId: meeraUser.id,
      branchId: calicutBranch.id,
      admissionNumber: 'ADM-CLT-2026-002',
      studentIdNumber: 'STU-CLT-902',
      dateOfBirth: new Date('2011-08-22'),
      gender: Gender.FEMALE,
      address: 'Heritage Villa, East Hill, Calicut',
      emergencyPhone: '+91 98470 66778',
      admissionClass: 'Class 9',
      classId: calicutClass9B.id,
    },
  });

  // Student 3: Arjun V (Demonstrating Branch Transfer: from Kochi to Calicut!)
  const arjunUser = await prisma.user.upsert({
    where: { email: 'arjun.student@schoolerp.com' },
    update: {},
    create: {
      name: 'Arjun V (Transferred Student)',
      email: 'arjun.student@schoolerp.com',
      password: studentPassword,
      phone: '+91 97450 33445',
      role: Role.STUDENT,
      status: AccountStatus.APPROVED,
      organizationId: organization.id,
      primaryBranchId: calicutBranch.id,
    },
  });
  const arjunProfile = await prisma.studentProfile.upsert({
    where: { userId: arjunUser.id },
    update: {},
    create: {
      userId: arjunUser.id,
      branchId: calicutBranch.id,
      admissionNumber: 'ADM-CLT-2026-003',
      studentIdNumber: 'STU-CLT-903',
      dateOfBirth: new Date('2011-11-10'),
      gender: Gender.MALE,
      address: 'New Housing Colony, Calicut',
      emergencyPhone: '+91 98470 77889',
      admissionClass: 'Class 9',
      classId: calicutClass9B.id,
    },
  });

  // Create Historical Branch Transfer Record for Arjun V
  await prisma.branchTransferHistory.create({
    data: {
      studentId: arjunProfile.id,
      fromBranchId: kochiBranch.id,
      toBranchId: calicutBranch.id,
      reason: 'Parent employment relocation from Kochi Headquarters to Calicut Zonal Office.',
      previousClass: 'Class 8A (Kochi Central)',
      authorizedById: orgAdmin.id,
      transferDate: new Date('2026-01-15T10:00:00Z'),
    },
  });
  console.log(`✓ Students seeded: Devanand (Kochi), Meera (Calicut), Arjun (Transferred from Kochi to Calicut)`);

  // 13. Parent Portal Linking
  const raviParent = await prisma.user.upsert({
    where: { email: 'ravi.parent@schoolerp.com' },
    update: {},
    create: {
      name: 'Ravi K (Father)',
      email: 'ravi.parent@schoolerp.com',
      password: parentPassword,
      phone: '+91 98470 55667',
      role: Role.PARENT,
      status: AccountStatus.APPROVED,
      organizationId: organization.id,
      primaryBranchId: kochiBranch.id,
    },
  });
  const raviProfile = await prisma.parentProfile.upsert({
    where: { userId: raviParent.id },
    update: {},
    create: {
      userId: raviParent.id,
      occupation: 'Chartered Financial Analyst',
      relationship: 'Father',
      address: 'Skyline Riverside Apt 4B, Panampilly Nagar, Kochi',
    },
  });
  await prisma.studentParentLink.upsert({
    where: { parentId_studentId: { parentId: raviProfile.id, studentId: devanandProfile.id } },
    update: {},
    create: {
      parentId: raviProfile.id,
      studentId: devanandProfile.id,
    },
  });
  console.log(`✓ Parent portal linked: Ravi K -> Devanand R`);

  // 14. Attendance & Leave
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Student Attendance
  await prisma.studentAttendance.upsert({
    where: { studentId_date: { studentId: devanandProfile.id, date: today } },
    update: {},
    create: {
      branchId: kochiBranch.id,
      classId: kochiClass8A.id,
      studentId: devanandProfile.id,
      date: today,
      status: AttendanceStatus.PRESENT,
      remarks: 'Present on time for morning assembly.',
    },
  });

  // Employee Attendance
  await prisma.employeeAttendance.upsert({
    where: { assignmentId_date: { assignmentId: anjaliKochiAssignment.id, date: today } },
    update: {},
    create: {
      branchId: kochiBranch.id,
      assignmentId: anjaliKochiAssignment.id,
      date: today,
      status: AttendanceStatus.PRESENT,
      checkIn: '08:45 AM',
      checkOut: '04:15 PM',
    },
  });

  // Leave Types
  const casualLeave = await prisma.leaveType.create({
    data: { name: 'Casual Leave', code: 'CL', daysAllowed: 12, description: 'Short personal absence' },
  }).catch(() => null);

  if (casualLeave) {
    await prisma.leaveApplication.create({
      data: {
        userId: anjaliTeacher.id,
        leaveTypeId: casualLeave.id,
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-11'),
        daysCount: 2,
        reason: 'Attending national mathematics educators seminar.',
        status: LeaveStatus.APPROVED,
        reviewNote: 'Approved. Alternate teacher assigned for Period 1.',
        reviewedById: kochiAdmin.id,
      },
    });
  }

  // 15. Fee Categories & Student Fees
  const tuitionFeeCat = await prisma.feeCategory.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Term 1 Tuition Fee' } },
    update: {},
    create: { organizationId: organization.id, name: 'Term 1 Tuition Fee', code: 'TUI-01', amount: 18000 },
  });

  const devFee = await prisma.studentFee.create({
    data: {
      branchId: kochiBranch.id,
      studentId: devanandProfile.id,
      categoryId: tuitionFeeCat.id,
      amountDue: 18000,
      amountPaid: 18000,
      dueDate: new Date('2026-04-10'),
      status: PaymentStatus.PAID,
    },
  });

  await prisma.feePayment.create({
    data: {
      studentFeeId: devFee.id,
      amount: 18000,
      paymentMethod: 'UPI',
      transactionRef: 'UPI-2026-KCH-998811',
      receiptNumber: 'RCP-KCH-2026-0042',
    },
  });

  // 16. Branch-Wise Payroll
  const kochiPayroll = await prisma.payroll.upsert({
    where: {
      branchId_month_year: {
        branchId: kochiBranch.id,
        month: 2,
        year: 2026,
      },
    },
    update: {},
    create: {
      branchId: kochiBranch.id,
      month: 2,
      year: 2026,
      periodName: 'February 2026',
      totalGross: 75000,
      totalNet: 71200,
      status: PaymentStatus.PAID,
      paidAt: new Date('2026-02-28T10:00:00Z'),
    },
  });

  await prisma.payrollItem.upsert({
    where: {
      payrollId_assignmentId: {
        payrollId: kochiPayroll.id,
        assignmentId: anjaliKochiAssignment.id,
      },
    },
    update: {},
    create: {
      payrollId: kochiPayroll.id,
      assignmentId: anjaliKochiAssignment.id,
      basicSalary: 28000,
      allowances: 8000,
      bonus: 1000,
      deductions: 1200,
      netSalary: 35800,
      paymentStatus: PaymentStatus.PAID,
      paymentDate: new Date('2026-02-28T10:00:00Z'),
      remarks: 'Full month salary credited to SBI account',
    },
  });

  // 17. Announcements (Multi-Level Scoping)
  // Org-wide announcement
  await prisma.announcement.create({
    data: {
      organizationId: organization.id,
      title: 'National Public Academy Group: Annual Academic Excellence Awards 2026',
      content: 'We are delighted to announce the Group-wide Academic Excellence & Innovation Summit scheduled for next month. Delegations from all campuses (Kochi, Calicut, Malappuram) will showcase student research and robotics prototypes.',
      priority: 'HIGH',
      targetAudience: AnnouncementTarget.ALL_ORGANIZATION,
      authorId: orgAdmin.id,
      isPinned: true,
    },
  });

  // Kochi Branch specific announcement
  await prisma.announcement.create({
    data: {
      organizationId: organization.id,
      branchId: kochiBranch.id,
      title: 'Kochi Central Campus: Regional Science Fair Registrations Open',
      content: 'Students of Class 8 and 9 are invited to submit their science project abstracts to Dr. Rajesh Menon by Friday.',
      priority: 'NORMAL',
      targetAudience: AnnouncementTarget.SELECTED_BRANCH,
      targetClass: 'Class 8A',
      authorId: kochiAdmin.id,
      isPinned: false,
    },
  });

  // Calicut Branch specific announcement
  await prisma.announcement.create({
    data: {
      organizationId: organization.id,
      branchId: calicutBranch.id,
      title: 'Calicut Heritage Branch: Zonal Athletic Meet Trials',
      content: 'Campus sports ground trials for 100m, 400m, and long jump will commence at 07:00 AM this Saturday.',
      priority: 'NORMAL',
      targetAudience: AnnouncementTarget.SELECTED_BRANCH,
      authorId: calicutAdmin.id,
      isPinned: false,
    },
  });

  console.log('====================================================');
  console.log('✓ MULTI-BRANCH SCHOOL ERP DATABASE SEED COMPLETE!');
  console.log('====================================================');
  console.log('Demo Credentials:');
  console.log('1. Super Admin:      superadmin@schoolerp.com / SuperAdmin@123  (Route: /platform/login)');
  console.log('2. Org Admin:        orgadmin@schoolerp.com   / OrgAdmin@123    (Route: /login)');
  console.log('3. Kochi Admin:      admin.kochi@schoolerp.com / Admin@123      (Route: /login)');
  console.log('4. Calicut Admin:    admin.calicut@schoolerp.com / Admin@123    (Route: /login)');
  console.log('5. Teacher (Multi):  anjali.teacher@schoolerp.com / Teacher@123 (Route: /login)');
  console.log('6. Staff:            priya.staff@schoolerp.com / Staff@123      (Route: /login)');
  console.log('7. Student (Kochi):  devanand.student@schoolerp.com / Student@123 (Route: /student/login)');
  console.log('8. Student (Calicut):meera.student@schoolerp.com / Student@123  (Route: /student/login)');
  console.log('9. Parent:           ravi.parent@schoolerp.com / Parent@123     (Route: /parent/login)');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
