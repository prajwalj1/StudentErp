const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const title = 'Everest View ERP - QA Testing Document';
const outputPath = path.join(__dirname, '..', 'Everest_View_ERP_QA_Testing_Document.pdf');
const publicOutputPath = path.join(__dirname, '..', 'public', 'Everest_View_ERP_QA_Testing_Document.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 58, bottom: 62, left: 55, right: 55 },
  bufferPages: true,
  info: {
    Title: title,
    Author: 'Everest View Secondary Boarding School',
    Subject: 'Quality assurance and testing documentation for the ERP School Management System',
    Keywords: 'QA, testing, Cypress, ERP, school management system, test plan, test cases',
  },
});

const outputStream = fs.createWriteStream(outputPath);
doc.pipe(outputStream);

outputStream.on('finish', () => {
  if (fs.existsSync(path.dirname(publicOutputPath))) {
    fs.copyFileSync(outputPath, publicOutputPath);
  }
  console.log(`PDF generated: ${outputPath}`);
  console.log(`Public copy updated: ${publicOutputPath}`);
});

const colors = {
  navy: '#0F172A',
  blue: '#1D4ED8',
  cyan: '#06B6D4',
  green: '#047857',
  amber: '#B45309',
  red: '#B91C1C',
  gray: '#64748B',
  light: '#F1F5F9',
  border: '#CBD5E1',
};

function footer(pageNumber) {
  doc.save();
  doc.font('Helvetica').fontSize(8).fillColor(colors.gray);
  doc.text(
    `Page ${pageNumber} | ${title}`,
    55,
    doc.page.height - 40,
    { width: doc.page.width - 110, align: 'center', lineBreak: false }
  );
  doc.restore();
}

function ensureSpace(height = 80) {
  if (doc.y + height > doc.page.height - 75) {
    doc.addPage();
  }
}

function h1(text) {
  doc.addPage();
  doc.moveDown(0.35);
  doc.font('Helvetica-Bold').fontSize(21).fillColor(colors.navy).text(text);
  doc.moveDown(0.25);
  doc.rect(55, doc.y, 72, 4).fill(colors.blue);
  doc.moveDown(1.1);
}

function h2(text) {
  ensureSpace(50);
  doc.moveDown(0.65);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.blue).text(text);
  doc.moveDown(0.35);
}

function h3(text) {
  ensureSpace(40);
  doc.moveDown(0.45);
  doc.font('Helvetica-Bold').fontSize(11.5).fillColor(colors.navy).text(text);
  doc.moveDown(0.25);
}

function para(text) {
  ensureSpace(45);
  doc.font('Helvetica').fontSize(10).fillColor(colors.navy).text(text, {
    lineGap: 4,
    align: 'justify',
  });
  doc.moveDown(0.45);
}

function bullet(text) {
  ensureSpace(28);
  doc.font('Helvetica').fontSize(10).fillColor(colors.navy).text(`- ${text}`, {
    indent: 16,
    lineGap: 3,
  });
  doc.moveDown(0.12);
}

function numbered(items) {
  items.forEach((item, index) => {
    ensureSpace(30);
    doc.font('Helvetica').fontSize(10).fillColor(colors.navy).text(`${index + 1}. ${item}`, {
      indent: 16,
      lineGap: 3,
    });
    doc.moveDown(0.15);
  });
}

function row(label, value) {
  ensureSpace(36);
  const x = 55;
  const y = doc.y;
  const labelWidth = 150;
  const valueWidth = doc.page.width - 110 - labelWidth;
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(colors.navy).text(label, x, y, { width: labelWidth });
  doc.font('Helvetica').fontSize(9.5).fillColor(colors.navy).text(value, x + labelWidth, y, {
    width: valueWidth,
    lineGap: 2,
  });
  const h = Math.max(
    doc.heightOfString(label, { width: labelWidth }),
    doc.heightOfString(value, { width: valueWidth })
  );
  doc.y = y + h + 8;
}

function infoBox(titleText, lines, color = colors.blue) {
  ensureSpace(48 + lines.length * 18);
  const x = 55;
  const y = doc.y;
  const width = doc.page.width - 110;
  const height = 30 + lines.length * 18;
  doc.save();
  doc.rect(x, y, width, height).fill(colors.light).stroke(colors.border);
  doc.rect(x, y, 5, height).fill(color);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(color).text(titleText, x + 14, y + 9, {
    width: width - 26,
  });
  doc.font('Helvetica').fontSize(9).fillColor(colors.navy);
  lines.forEach((line, index) => {
    doc.text(`- ${line}`, x + 18, y + 32 + index * 18, { width: width - 36 });
  });
  doc.restore();
  doc.y = y + height + 14;
}

function table(titleText, rows) {
  h2(titleText);
  rows.forEach(([label, value]) => row(label, value));
}

function sectionList(titleText, items) {
  h2(titleText);
  items.forEach(bullet);
}

// Cover page
doc.save();
doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.navy);
doc.rect(0, 0, doc.page.width, 8).fill(colors.blue);
doc.font('Helvetica-Bold').fontSize(36).fillColor('#FFFFFF').text('QA Testing', 55, 168);
doc.font('Helvetica-Bold').fontSize(30).fillColor('#FFFFFF').text('Document', 55, 212);
doc.font('Helvetica').fontSize(15).fillColor(colors.cyan).text('Everest View ERP School Management System', 55, 268);
doc.rect(55, 304, 90, 4).fill(colors.blue);
doc.font('Helvetica').fontSize(10).fillColor('#CBD5E1').text('Document Type: Quality Assurance, Test Plan, Test Cases, and Test Strategy', 55, 345);
doc.text('Project: ERP School / Student ERP', 55, 364);
doc.text('Framework: Next.js, React, MongoDB, NextAuth.js, Cypress', 55, 383);
doc.text(`Prepared On: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 55, 402);
doc.font('Helvetica').fontSize(9).fillColor('#94A3B8').text('Confidential - For QA review, academic documentation, and project validation use', 55, doc.page.height - 78, {
  width: doc.page.width - 110,
  align: 'center',
});
doc.restore();

h1('Table of Contents');
[
  '1. QA Executive Summary',
  '2. QA Objectives',
  '3. Project Under Test',
  '4. Test Environment',
  '5. Testing Scope',
  '6. Testing Types',
  '7. Cypress Test Architecture',
  '8. Public Website Test Cases',
  '9. Authentication and Authorization Test Cases',
  '10. Owner Module Test Cases',
  '11. Teacher Module Test Cases',
  '12. Student Module Test Cases',
  '13. API Test Cases',
  '14. Data Validation Test Cases',
  '15. Security and Access Control Testing',
  '16. Responsive and UI Testing',
  '17. Regression Testing Strategy',
  '18. Defect Management Process',
  '19. QA Execution Checklist',
  '20. QA Sign-Off Recommendation',
].forEach((item) => {
  doc.font('Helvetica').fontSize(10.5).fillColor(colors.navy).text(item, { indent: 12, lineGap: 6 });
});

h1('1. QA Executive Summary');
para('This QA Testing Document defines the quality assurance process for the Everest View ERP School Management System. The project is a role-based school ERP application with public pages, owner administration, teacher portal, student portal, protected API routes, authentication, fee management, academic records, notices, assignments, attendance, examinations, and reports.');
para('The QA goal is to verify that the ERP works correctly for all major user roles and that the system remains secure, usable, responsive, and reliable. The project already includes Cypress end-to-end tests organized across public, owner, teacher, student, shared, and API test folders. This document formalizes the testing approach, expected coverage, test cases, regression strategy, and sign-off checklist.');
infoBox('Current Automated QA Structure', [
  '34 Cypress spec files are present under cypress/e2e.',
  'Coverage areas include public pages, owner pages, teacher pages, student pages, shared sidebar navigation, and API routes.',
  'Cypress is configured with baseUrl http://localhost:3000, screenshot capture on failure, and role session helpers.',
  'Custom commands support owner, teacher, and student login/session setup.',
], colors.green);

h1('2. QA Objectives');
para('The QA process validates that the ERP meets functional requirements and provides a stable user experience. Testing must cover both normal workflows and failure conditions, especially because the application stores academic, attendance, and financial data.');
sectionList('Primary QA Objectives', [
  'Verify that public pages load correctly and navigation works as expected.',
  'Verify that login, logout, session handling, and role-based redirects work correctly.',
  'Verify owner workflows for students, teachers, classes, attendance, marks, exams, fees, results, reports, notices, and passout records.',
  'Verify teacher workflows for dashboard, classes, students, attendance, exams, assignments, marks, and notices.',
  'Verify student workflows for dashboard, marksheet, assignments, routine, and fees.',
  'Verify protected API endpoints reject unauthenticated access.',
  'Verify API responses return expected status codes and response shapes.',
  'Verify responsive behavior on desktop and mobile layouts.',
  'Verify that critical actions provide validation, feedback, and confirmation where required.',
]);

h1('3. Project Under Test');
para('The application under test is a Next.js school ERP system. It contains public marketing pages and authenticated dashboard sections for three roles: owner, teacher, and student. The backend is implemented through Next.js API routes and MongoDB models.');
table('Project Summary', [
  ['Application Name', 'Everest View ERP / ERP School Management System'],
  ['Framework', 'Next.js with React'],
  ['Database', 'MongoDB with Mongoose models'],
  ['Authentication', 'NextAuth.js credentials-based authentication'],
  ['Payment Flow', 'eSewa initiate and success callback routes for student fee payment'],
  ['Date Handling', 'Bikram Sambat and Gregorian date support for school workflows'],
  ['Automated Test Tool', 'Cypress end-to-end testing'],
]);
h2('Major Functional Areas');
bullet('Public landing page, legal pages, login page, and not found page.');
bullet('Owner dashboard and complete administration modules.');
bullet('Teacher dashboard and classroom management modules.');
bullet('Student dashboard and self-service modules.');
bullet('REST-style API routes for students, teachers, classes, attendance, marks, fees, exams, assignments, submissions, notices, statistics, and authentication.');

h1('4. Test Environment');
para('Testing is designed to run locally against the development server. The Cypress configuration uses a base URL of http://localhost:3000 and browser viewport dimensions of 1280 by 720 for standard desktop testing.');
table('Environment Configuration', [
  ['Application URL', 'http://localhost:3000'],
  ['Cypress Config File', 'cypress.config.js'],
  ['Viewport', '1280 x 720 by default'],
  ['Screenshots', 'Enabled on test failure'],
  ['Videos', 'Disabled'],
  ['Default Timeout', '10000 ms'],
  ['Session Tokens', 'Generated through createSessionToken task using NEXTAUTH_SECRET'],
]);
h2('Required Setup Before Test Execution');
numbered([
  'Install dependencies using npm install if node_modules is not present.',
  'Create a valid .env file with database connection and NEXTAUTH_SECRET.',
  'Start the development server using npm run dev.',
  'Run Cypress tests from another terminal using npx cypress run or npx cypress open.',
  'Review screenshots and terminal output for failed tests.',
]);
infoBox('Important Note', [
  'The current package.json includes lint, dev, build, and start scripts, but does not define a dedicated test script.',
  'Recommended future improvement: add scripts such as test:e2e and test:e2e:open for consistent QA execution.',
], colors.amber);

h1('5. Testing Scope');
para('The QA scope includes functional testing, navigation testing, API testing, role-based access testing, UI testing, and regression testing for all major modules. Testing should focus first on critical school operations and then cover secondary visual and usability issues.');
h2('In Scope');
bullet('Public website page rendering and navigation.');
bullet('Login page behavior, valid and invalid credential handling, and session redirects.');
bullet('Owner administration screens and critical workflows.');
bullet('Teacher portal screens and assigned-class workflows.');
bullet('Student portal screens and self-service workflows.');
bullet('Protected API endpoint access rules and response format checks.');
bullet('Sidebar and dashboard navigation.');
bullet('Form controls, modals, tabs, filters, buttons, and empty states.');
h2('Out of Scope for Current Automated Suite');
bullet('Load testing with a large production-sized database.');
bullet('Native mobile application testing.');
bullet('Real payment gateway settlement verification beyond callback handling.');
bullet('Accessibility audit using automated WCAG tooling.');
bullet('Cross-browser matrix execution across all major browsers unless Cypress is configured for it.');

h1('6. Testing Types');
h2('Functional Testing');
para('Functional testing verifies that each ERP feature works according to expected behavior. This includes page loading, form submission, modal display, filters, tabs, CRUD flows, dashboard cards, payment sections, and report displays.');
h2('End-to-End Testing');
para('End-to-end testing verifies real user flows across pages. Cypress tests are used for user-facing workflows such as login, owner navigation, teacher page access, student dashboard viewing, and API checks.');
h2('API Testing');
para('API testing verifies status codes, authentication rules, and response shapes for backend routes. The existing suite includes unauthenticated checks and owner-authenticated API response validation.');
h2('Regression Testing');
para('Regression testing should be executed after every meaningful change to authentication, data models, API routes, UI pages, or shared components to ensure existing modules still work.');
h2('Security Testing');
para('Security testing focuses on unauthenticated access rejection, role-based route protection, safe session handling, and protection of sensitive student, teacher, and fee data.');

h1('7. Cypress Test Architecture');
para('The Cypress test suite is organized by application area. This makes it easy to run or review tests for a specific role or module. Custom commands reduce repetition for login and session creation.');
table('Cypress Folder Coverage', [
  ['cypress/e2e/public', 'Landing page, login page, legal pages, layout, and 404 page tests.'],
  ['cypress/e2e/owner', 'Owner dashboard and administration module tests.'],
  ['cypress/e2e/teacher', 'Teacher dashboard and classroom module tests.'],
  ['cypress/e2e/student', 'Student dashboard, assignments, marksheet, routine, and fees tests.'],
  ['cypress/e2e/shared', 'Shared sidebar navigation tests for all roles.'],
  ['cypress/e2e/api', 'Authentication, public endpoint, protected endpoint, and owner API tests.'],
  ['cypress/support/commands.js', 'Reusable login/session helpers for owner, teacher, and student roles.'],
]);
h2('Session Strategy');
bullet('Owner login uses the login page and expected owner credentials.');
bullet('Teacher and student tests use mocked session/API responses and generated NextAuth session tokens.');
bullet('The createSessionToken task encodes role-specific user data using NEXTAUTH_SECRET.');
bullet('API tests use cy.request to check endpoint status and response structure.');

h1('8. Public Website Test Cases');
para('Public website testing verifies that unauthenticated users can access the landing page, legal information, login page, and custom not found page. These tests protect the first impression and public navigation of the school ERP.');
h2('Public Test Coverage');
bullet('Home page loads and displays the main school/ERP sections.');
bullet('Header, footer, public layout, and navigation links render correctly.');
bullet('Login page displays identifier and password fields.');
bullet('Legal pages for privacy, terms, and cookies are accessible.');
bullet('Invalid routes display the custom 404 page.');
h2('Recommended Manual Checks');
bullet('Verify smooth-scroll links on the landing page.');
bullet('Verify public pages on small mobile screens.');
bullet('Verify contact form success and failure states with valid and invalid input.');
bullet('Verify newsletter subscribe and unsubscribe flows.');

h1('9. Authentication and Authorization Test Cases');
para('Authentication and authorization are critical because the ERP contains private school data. Testing must confirm valid login, invalid login, route protection, session persistence, and role separation.');
h2('Existing Auth API Checks');
bullet('Rejects login with missing credentials.');
bullet('Allows login with owner credentials.');
bullet('Rejects login with wrong password.');
h2('Role-Based Access Test Cases');
numbered([
  'Unauthenticated user visits /owner/dashboard and should be redirected to /login.',
  'Unauthenticated user visits /teacher/dashboard and should be redirected to /login.',
  'Unauthenticated user visits /student/dashboard and should be redirected to /login.',
  'Owner user should access owner dashboard and owner module pages.',
  'Teacher user should access teacher dashboard and teacher module pages.',
  'Student user should access student dashboard and student module pages.',
  'Teacher and student users should not access owner-only pages.',
  'Logout should clear the authenticated session and return user to public flow.',
]);

h1('10. Owner Module Test Cases');
para('The owner role has the broadest access and must receive the highest QA attention. Owner tests should verify all management modules, data display, controls, forms, and confirmation behavior.');
h2('Owner Dashboard');
bullet('Dashboard loads with KPI cards, greeting, quick actions, and system summary.');
bullet('Quick action cards navigate to students, teachers, fees, exams, attendance, and reports.');
bullet('System health and statistics sections handle loading and empty states.');
h2('Student Management');
bullet('Students page displays header, search, grade filter, Add Student, and Promote All controls.');
bullet('Add Student button opens the student modal.');
bullet('Student records show name, ID, grade, section, email, attendance, and actions.');
bullet('Promotion flow should require confirmation and handle Grade 12 passout behavior.');
h2('Teacher Management');
bullet('Teachers page displays list/table and correct columns.');
bullet('Add Teacher button opens modal and cancel closes it.');
bullet('Search, edit, delete, view, and export controls should behave consistently.');
h2('Classes, Attendance, Marks, Exams');
bullet('Classes page supports schedule cards and teacher assignment display.');
bullet('Attendance page supports register and mark views, class selection, date selection, and P/A status.');
bullet('Marks page supports exam type, grade, section, subject selection, marks entry, and grade calculation.');
bullet('Exams page supports grade selection, term tabs, and adding subjects.');
h2('Fees, Results, Reports, Notices, Passout');
bullet('Fees page displays fee structure, overview, and history tabs.');
bullet('Results page displays exam and grade selectors plus print option.');
bullet('Reports page displays school summary metrics.');
bullet('Notices page supports title, content, audience selection, publish, list, and delete behavior.');
bullet('Passout page displays graduated students and handles empty state.');

h1('11. Teacher Module Test Cases');
para('Teacher QA verifies classroom-focused workflows. Teacher access should remain scoped to assigned classes and should not expose full administrative controls.');
h2('Teacher Dashboard');
bullet('Dashboard displays welcome banner, assigned schedule section, my students section, and class performance section.');
bullet('Dashboard action buttons navigate to teacher classes, students, attendance, and notices.');
h2('Teacher Classes and Students');
bullet('Classes page displays assigned class schedules or empty state when no classes are assigned.');
bullet('Students page displays student information related to teacher assignments.');
bullet('Search and class grouping should be clear for classroom use.');
h2('Teacher Attendance');
bullet('Attendance page loads and shows class selector.');
bullet('Teacher can mark attendance for assigned grades only.');
bullet('Register view and mark view should be clear and date-aware.');
h2('Teacher Exams, Assignments, Marks, Notices');
bullet('Exams page displays exam management UI and page description.');
bullet('Assignments page displays assignment management UI.');
bullet('Marks page displays marks entry UI, exam type selector, and grade selector.');
bullet('Notices page displays active notices or empty state.');

h1('12. Student Module Test Cases');
para('Student QA validates self-service flows and ensures students only see their own data. The student portal must be easy to use on mobile and desktop.');
h2('Student Dashboard');
bullet('Student portal loads with dashboard title or welcome content.');
bullet('Stats cards display attendance, average score, fee status, and pending assignments.');
bullet('Quick links navigate to marksheet, assignments, routine, and fees.');
bullet('Quick info sidebar displays student identity and grade details.');
h2('Student Marksheet');
bullet('Marksheet page displays page header, school letterhead, and progress report title.');
bullet('Marks table or empty state appears depending on available data.');
bullet('Grade, GPA, total marks, and pass/fail status should calculate correctly.');
h2('Student Assignments');
bullet('Assignments page lists assigned work or shows empty state.');
bullet('Submission flow should accept valid file input and show feedback.');
bullet('Submitted status should be visible after submission.');
h2('Student Routine and Fees');
bullet('Routine page displays exam routine for the student grade.');
bullet('Fees page displays bill header, fee summary, due amount, payment section, and history.');
bullet('eSewa payment flow should handle success, failure, and error redirects.');

h1('13. API Test Cases');
para('API testing confirms backend behavior independent of the UI. The existing suite includes public endpoint checks, unauthenticated protected endpoint checks, authentication checks, and owner-authenticated API response checks.');
h2('Public Endpoint Checks');
bullet('GET /api/contact should return a controlled response such as 405, 200, or 404 depending on implementation.');
bullet('POST /api/subscribe accepts email and returns expected status such as 201, 200, 409, or 400.');
h2('Protected Endpoint Checks');
bullet('Unauthenticated GET requests to teachers, students, fees, classes, attendance, marks, exams, exam-routines, notices, and owner stats should return 401.');
h2('Owner Authenticated API Checks');
bullet('GET /api/teachers returns status 200 and an array.');
bullet('GET /api/students returns status 200 and an array.');
bullet('GET /api/classes returns status 200 and an array.');
bullet('GET /api/fees returns status 200 and contains students, payments, and classFees.');
bullet('GET /api/exams, /api/exam-routines, /api/attendance, /api/marks, and /api/notices return status 200 with arrays.');
bullet('GET /api/owner/stats returns status 200 with students, teachers, revenue, and attendance properties.');

h1('14. Data Validation Test Cases');
para('Data validation prevents incorrect school records from entering the database. QA should test both client-side and API-level validation wherever applicable.');
h2('Student and Teacher Validation');
bullet('Required fields must not accept blank values.');
bullet('Student ID and teacher ID should be unique.');
bullet('Email fields should reject invalid email formats.');
bullet('Password fields should meet the configured minimum requirements.');
h2('Academic Validation');
bullet('Marks should not be less than zero or greater than full marks.');
bullet('Exam pass marks should not exceed full marks.');
bullet('Attendance should not be marked for future dates.');
bullet('Grade, section, subject, and exam type selections should be required before saving marks.');
h2('Fee Validation');
bullet('Fee amounts, previous due, scholarship, and paid amount should accept only valid numeric values.');
bullet('Partial payment amount should not exceed due amount unless business rules allow adjustment.');
bullet('Payment history should preserve transaction records after payment.');

h1('15. Security and Access Control Testing');
para('Security testing protects private school information. The ERP must ensure that users only access information and actions allowed by their role.');
h2('Security Test Areas');
bullet('Protected dashboard pages redirect unauthenticated users to login.');
bullet('Protected API endpoints return 401 for unauthenticated requests.');
bullet('Students cannot access other students records through UI or API parameters.');
bullet('Teachers cannot perform owner-only operations such as managing all fees or deleting all students.');
bullet('Session tokens expire according to configured NextAuth behavior.');
bullet('Logout removes user access to protected routes.');
bullet('Sensitive values such as passwords and secrets are not exposed in responses or UI.');
h2('Payment Security Checks');
bullet('eSewa success route handles missing or invalid data safely.');
bullet('Failed or cancelled payment status should not mark fees as paid.');
bullet('Successful payment callbacks should update only the intended student transaction.');

h1('16. Responsive and UI Testing');
para('The ERP should work on desktops, tablets, and mobile devices. Responsive testing is important because students and teachers may use mobile phones to access assignments, marks, routines, and notices.');
h2('Responsive Checks');
bullet('Landing page sections stack correctly on mobile.');
bullet('Header and mobile menu work on small screens.');
bullet('Dashboard sidebars collapse or become accessible through mobile navigation.');
bullet('Tables remain readable through responsive layout, scrolling, or card transformation.');
bullet('Forms, modals, and date pickers fit within mobile viewport width.');
bullet('Buttons and inputs have enough touch area for mobile use.');
h2('UI Consistency Checks');
bullet('Page titles and module names are consistent with sidebar navigation.');
bullet('Primary actions use consistent styling and placement.');
bullet('Success, warning, error, and empty states are visually distinct.');
bullet('Print views for marksheets, results, fees, and routines are readable.');

h1('17. Regression Testing Strategy');
para('Regression testing should be run whenever code changes may affect existing behavior. In this ERP, shared changes to authentication, layout, API routes, models, or utility functions can impact many modules at once.');
h2('Recommended Regression Triggers');
bullet('Changes to NextAuth configuration, middleware, or session handling.');
bullet('Changes to MongoDB models or API route response shapes.');
bullet('Changes to shared components such as Header, Footer, Sidebar, or LayoutWrapper.');
bullet('Changes to grading, fee calculation, attendance date conversion, or payment callback logic.');
bullet('Changes to route structure or dashboard navigation.');
h2('Regression Execution Order');
numbered([
  'Run linting using npm run lint.',
  'Build the application using npm run build when feasible.',
  'Start the app locally using npm run dev.',
  'Run Cypress API tests first to validate backend access rules.',
  'Run public and authentication tests.',
  'Run owner, teacher, student, and shared navigation tests.',
  'Manually verify high-risk workflows such as fees, marks, attendance, and payment callback scenarios.',
]);

h1('18. Defect Management Process');
para('Defects found during QA should be recorded clearly so developers can reproduce, prioritize, and fix them. Every bug report should include environment details, user role, route, steps, expected result, actual result, and evidence.');
h2('Defect Severity Levels');
row('Critical', 'System unavailable, login broken for all users, data loss, payment incorrectly marked, or severe security access issue.');
row('High', 'Core module broken such as attendance save failure, marks not saving, fee calculation incorrect, or owner CRUD failing.');
row('Medium', 'Feature partially works but has incorrect UI, missing validation, incorrect empty state, or non-critical API issue.');
row('Low', 'Minor style issue, wording issue, spacing problem, or non-blocking UI inconsistency.');
h2('Bug Report Template');
bullet('Title: Short description of the issue.');
bullet('Environment: Browser, OS, local/staging/production, and app URL.');
bullet('Role: Owner, Teacher, Student, or Public user.');
bullet('Route: Page or API endpoint where issue occurred.');
bullet('Steps to Reproduce: Clear numbered steps.');
bullet('Expected Result: What should happen.');
bullet('Actual Result: What happened.');
bullet('Evidence: Screenshot, Cypress failure screenshot, console error, or network response.');
bullet('Severity and Priority: Business impact and fix urgency.');

h1('19. QA Execution Checklist');
para('The following checklist should be completed before project delivery or demonstration.');
h2('Pre-Test Checklist');
bullet('Dependencies installed successfully.');
bullet('Environment variables configured, including database URI and NEXTAUTH_SECRET.');
bullet('Development server starts without runtime errors.');
bullet('Database connection works.');
bullet('Test accounts or session mocks are available for owner, teacher, and student roles.');
h2('Execution Checklist');
bullet('Public page tests executed.');
bullet('Authentication tests executed.');
bullet('Owner module tests executed.');
bullet('Teacher module tests executed.');
bullet('Student module tests executed.');
bullet('API tests executed.');
bullet('Sidebar and navigation tests executed.');
bullet('Manual mobile responsive checks completed.');
bullet('Critical business workflows manually verified.');
h2('Post-Test Checklist');
bullet('Failed tests reviewed and categorized.');
bullet('Screenshots or logs attached to defect reports.');
bullet('Critical and high severity defects fixed and retested.');
bullet('Regression suite rerun after fixes.');
bullet('QA summary prepared for sign-off.');

h1('20. QA Sign-Off Recommendation');
para('The ERP should be considered ready for delivery only when core workflows pass automated and manual QA checks. Because the system handles academic records and financial information, owner, teacher, student, and API tests should be treated as mandatory before final approval.');
infoBox('Recommended Release Criteria', [
  'No open critical defects.',
  'No open high severity defects in login, role access, attendance, marks, fees, payment, or student records.',
  'Public, owner, teacher, student, shared navigation, and API Cypress suites pass in the target environment.',
  'Manual responsive checks pass for the most important screens.',
  'Documentation PDFs are generated and available for review.',
], colors.green);
para('Final QA sign-off should be given after all mandatory tests pass, defects are documented, and stakeholders accept any remaining low-risk limitations.');

doc.addPage();
doc.font('Helvetica-Bold').fontSize(28).fillColor(colors.navy).text('End of QA Testing Document', 55, 220, {
  width: doc.page.width - 110,
  align: 'center',
});
doc.moveDown(1);
doc.font('Helvetica').fontSize(11).fillColor(colors.gray).text('This document defines the QA testing process for the Everest View ERP School Management System.', 55, 282, {
  width: doc.page.width - 110,
  align: 'center',
});
doc.moveDown(3);
doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.blue).text('Everest View Secondary Boarding School', 55, 378, {
  width: doc.page.width - 110,
  align: 'center',
});
doc.font('Helvetica').fontSize(9).fillColor(colors.gray).text('ERP School Management System QA Documentation', 55, 396, {
  width: doc.page.width - 110,
  align: 'center',
});

const pageRange = doc.bufferedPageRange();
for (let i = pageRange.start; i < pageRange.start + pageRange.count; i += 1) {
  doc.switchToPage(i);
  footer(i + 1);
}

doc.end();
