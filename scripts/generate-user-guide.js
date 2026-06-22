const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 60, bottom: 60, left: 55, right: 55 },
  info: {
    Title: 'Everest View ERP - Complete User Guide',
    Author: 'Everest View Secondary Boarding School',
    Subject: 'ERP School Management System Full Documentation',
  },
});

const outputPath = path.join(__dirname, '..', 'Everest_View_ERP_Complete_User_Guide.pdf');
const publicOutputPath = path.join(__dirname, '..', 'public', 'Everest_View_ERP_Complete_User_Guide.pdf');
const outputStream = fs.createWriteStream(outputPath);
doc.pipe(outputStream);
outputStream.on('finish', () => {
  if (fs.existsSync(path.dirname(publicOutputPath))) {
    fs.copyFileSync(outputPath, publicOutputPath);
  }
  console.log(`PDF generated: ${outputPath}`);
  console.log(`Public copy updated: ${publicOutputPath}`);
});

const primaryColor = '#1D4ED8';
const secondaryColor = '#0F172A';
const accentColor = '#3B82F6';
const grayColor = '#64748B';
const lightGray = '#F1F5F9';

let pageNumber = 0;

function addFooter() {
  pageNumber++;
  doc.save();
  doc.fontSize(8).fillColor(grayColor);
  doc.text(
    `Page ${pageNumber} — Everest View Secondary Boarding School ERP User Guide`,
    55, doc.page.height - 40,
    { align: 'center', width: doc.page.width - 110 }
  );
  doc.restore();
}

function heading1(text) {
  doc.addPage();
  addFooter();
  doc.save();
  doc.fontSize(22).fillColor(secondaryColor).font('Helvetica-Bold');
  doc.text(text);
  doc.moveDown(0.3);
  doc.rect(55, doc.y, 60, 4).fill(primaryColor);
  doc.moveDown(1.2);
  doc.restore();
}

function heading2(text) {
  doc.moveDown(0.8);
  doc.save();
  doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold');
  doc.text(text);
  doc.moveDown(0.5);
  doc.restore();
}

function heading3(text) {
  doc.moveDown(0.5);
  doc.save();
  doc.fontSize(12).fillColor(secondaryColor).font('Helvetica-Bold');
  doc.text(text);
  doc.moveDown(0.3);
  doc.restore();
}

function para(text) {
  doc.save();
  doc.fontSize(10).fillColor(secondaryColor).font('Helvetica');
  doc.text(text, { lineGap: 4, align: 'justify' });
  doc.moveDown(0.5);
  doc.restore();
}

function bullet(text, indent = 0) {
  doc.save();
  doc.fontSize(10).fillColor(secondaryColor).font('Helvetica');
  doc.text(`•  ${text}`, { indent: 20 + indent, lineGap: 3 });
  doc.moveDown(0.15);
  doc.restore();
}

function infoBox(title, lines) {
  doc.save();
  const boxTop = doc.y;
  doc.rect(55, boxTop, doc.page.width - 110, 25 + lines.length * 18).fill(lightGray);
  doc.rect(55, boxTop, doc.page.width - 110, 25 + lines.length * 18).stroke('#CBD5E1');
  doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold');
  doc.text(title, 65, boxTop + 7);
  doc.fontSize(9).fillColor(secondaryColor).font('Helvetica');
  lines.forEach((line, i) => {
    doc.text(`›  ${line}`, 65, boxTop + 27 + i * 18);
  });
  doc.y = boxTop + 25 + lines.length * 18 + 15;
  doc.restore();
}

function twoCol(col1, col2) {
  doc.save();
  const y = doc.y;
  doc.fontSize(10).fillColor(secondaryColor).font('Helvetica');
  doc.text(col1, 55, y, { width: (doc.page.width - 110) / 2 - 5 });
  doc.text(col2, 55 + (doc.page.width - 110) / 2 + 5, y, { width: (doc.page.width - 110) / 2 - 5 });
  const h1 = doc.heightOfString(col1, { width: (doc.page.width - 110) / 2 - 5 });
  const h2 = doc.heightOfString(col2, { width: (doc.page.width - 110) / 2 - 5 });
  doc.y = y + Math.max(h1, h2) + 5;
  doc.restore();
}

// ===== COVER PAGE =====
doc.save();
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0F172A');
doc.rect(0, 0, doc.page.width, 6).fill(primaryColor);

doc.fontSize(42).fillColor('#FFFFFF').font('Helvetica-Bold');
doc.text('Everest View ERP', 55, 180);
doc.fontSize(18).fillColor(accentColor).font('Helvetica');
doc.text('School Management System', 55, 235);

doc.fontSize(12).fillColor('#94A3B8').font('Helvetica');
doc.text('Complete User Guide & Documentation', 55, 290);
doc.text('Everest View Secondary Boarding School', 55, 310);

doc.rect(55, 350, 80, 3).fill(primaryColor);

doc.fontSize(10).fillColor('#64748B').font('Helvetica');
doc.text('Version 1.0', 55, 380);
doc.text(`Published: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 55, 398);

doc.fontSize(10).fillColor('#64748B').font('Helvetica');
doc.text('Everest View Secondary Boarding School', 55, doc.page.height - 80, { align: 'center', width: doc.page.width - 110 });
doc.fontSize(8).fillColor('#64748B').font('Helvetica');
doc.text('Confidential — For authorized users only', 55, doc.page.height - 55, { align: 'center', width: doc.page.width - 110 });
doc.restore();
addFooter();

// ===== TABLE OF CONTENTS =====
heading1('Table of Contents');
const tocItems = [
  ['1', 'Introduction', '3'],
  ['2', 'System Overview', '4'],
  ['3', 'Getting Started', '5'],
  ['4', 'Login & Authentication', '6'],
  ['5', 'Landing Page', '7'],
  ['6', 'Header Navigation', '9'],
  ['7', 'Footer', '10'],
  ['8', 'Owner Dashboard', '11'],
  ['9', 'Student Management', '12'],
  ['10', 'Teacher Management', '14'],
  ['11', 'Class Scheduling', '15'],
  ['12', 'Attendance Management', '16'],
  ['13', 'Marks Entry & Grading', '18'],
  ['14', 'Examination Management', '19'],
  ['15', 'Fee Management', '20'],
  ['16', 'Results & Report Cards', '22'],
  ['17', 'School Reports', '23'],
  ['18', 'Notice Management', '24'],
  ['19', 'Passout Students', '25'],
  ['20', 'Teacher Dashboard', '26'],
  ['21', 'Teacher Classes', '27'],
  ['22', 'Teacher Students', '28'],
  ['23', 'Teacher Attendance', '29'],
  ['24', 'Teacher Exams', '30'],
  ['25', 'Teacher Assignments', '31'],
  ['26', 'Teacher Marks Entry', '32'],
  ['27', 'Teacher Notices', '33'],
  ['28', 'Student Dashboard', '34'],
  ['29', 'Student Marksheet', '35'],
  ['30', 'Student Assignments', '36'],
  ['31', 'Student Routine', '37'],
  ['32', 'Student Fees', '38'],
  ['33', 'Legal Pages', '39'],
  ['34', 'API Reference', '40'],
  ['35', 'Technical Architecture', '41'],
  ['36', 'Support', '42'],
];
doc.save();
tocItems.forEach(([num, title, page]) => {
  const dots = '.'.repeat(Math.max(1, Math.floor((doc.page.width - 180) / 3.5) - title.length));
  doc.fontSize(10).fillColor(secondaryColor).font('Helvetica');
  doc.text(`${num}.  ${title}  ${dots}  ${page}`, { indent: 10, lineGap: 5 });
});
doc.restore();

// ===== 1. INTRODUCTION =====
heading1('1. Introduction');
para('Everest View ERP is a comprehensive School Management System designed and built for Everest View Secondary Boarding School. The platform streamlines all academic and administrative operations including student records, attendance tracking, fee management, examination results, teacher assignments, and stakeholder communication.');
para('Built with modern web technologies — Next.js 16, React 19, Tailwind CSS, MongoDB, and NextAuth.js — the system delivers a fast, responsive, and intuitive experience across desktop, tablet, and mobile devices.');
para('The system provides role-based access with three primary user roles: Owner (School Administrator), Teacher, and Student. Each role has a tailored dashboard, navigation sidebar, and feature set aligned with their specific responsibilities.');

infoBox('Key Highlights', [
  'Student lifecycle management from enrollment to passout/graduation',
  'Bikram Sambat (Nepali calendar) based attendance system',
  'Multi-term fee structure with eSewa payment gateway integration',
  'Examination grading with GPA computation and report cards',
  'Digital notice board with image upload and audience targeting',
  'Real-time dashboards with KPI cards and performance analytics',
  'Assignment distribution and submission tracking',
  'System health monitoring with CPU/memory/database status',
]);

// ===== 2. SYSTEM OVERVIEW =====
heading1('2. System Overview');

heading2('Technology Stack');
twoCol('Frontend Framework', 'Next.js 16.2.6 + React 19.2.4');
twoCol('Styling', 'Tailwind CSS v4');
twoCol('Database', 'MongoDB with Mongoose');
twoCol('Authentication', 'NextAuth.js v4');
twoCol('Date System', 'Bikram Sambat (react-bs-calender)');
twoCol('Payment Gateway', 'eSewa');
twoCol('Fonts', 'Geist, Geist Mono, Playfair Display');

heading2('User Roles & Permissions');
para('The system has three hierarchical roles with distinct access levels:');
bullet('Owner — Full administrative access. Can manage students, teachers, classes, attendance, marks, fees, exams, results, reports, notices, and passout records. Access to all owner routes under /owner/*.');
bullet('Teacher — Access to assigned classes, attendance marking, exam creation, assignment distribution, and marks entry. Routes under /teacher/*.');
bullet('Student — Access to personal dashboard, marksheet, assignments, class routine, and fee information. Routes under /student/*.');

heading2('Route Protection');
para('All dashboard routes (/owner/*, /teacher/*, /student/*) are protected by NextAuth middleware. Unauthenticated users are redirected to the login page. Role-based access is enforced at the page level with session checks and redirects.');

// ===== 3. GETTING STARTED =====
heading1('3. Getting Started');

heading3('Accessing the Platform');
para('Open any modern web browser (Chrome, Firefox, Edge, Safari) and navigate to the school ERP URL. The landing page loads with the hero section, providing an overview of the system and school.');

heading3('Browser Requirements');
bullet('Chrome 90+ / Firefox 90+ / Edge 90+ / Safari 15+');
bullet('JavaScript enabled');
bullet('Active internet connection');
bullet('Minimum screen resolution: 320px (fully responsive)');

heading3('Navigation Structure');
para('The application uses a dual navigation system:');
bullet('Top Header Bar — Visible on the landing page and legal pages. Contains Home, Features, Virtual Tour, About, Contact links plus Sign In / Dashboard buttons.');
bullet('Sidebar — Visible inside dashboard pages after login. Provides role-specific navigation links. On mobile, the sidebar is hidden by default and toggled via a hamburger menu button.');

// ===== 4. LOGIN & AUTHENTICATION =====
heading1('4. Login & Authentication');

heading2('Login Page');
para('The login page (/login) is split into two sections. The left side displays a full-height school image overlay with branding. The right side contains the login form.');

heading3('Login Credentials');
bullet('Identifier — Email address, Teacher ID, or Student ID');
bullet('Password — Account password set during creation');

heading3('Login Steps');
bullet('Step 1: Enter your identifier in the first field');
bullet('Step 2: Enter your password (toggle visibility with the eye icon)');
bullet('Step 3: Click the "Login" button');
bullet('Step 4: On success, a "Welcome back!" overlay appears with a checkmark animation');
bullet('Step 5: Auto-redirect to your role-specific dashboard after 1.5 seconds');

heading3('Auto-Redirect on Login');
twoCol('Owner → /owner/dashboard', 'Teacher → /teacher/dashboard');
twoCol('Student → /student/dashboard', '');

heading3('Session Persistence');
para('Once logged in, the session persists across page refreshes. The header shows the user name, role badge, and a profile icon. Clicking the profile icon opens a logout confirmation modal.');

heading3('Logout Process');
bullet('Click the profile image in the header');
bullet('Confirm "Yes, Logout" in the confirmation dialog');
bullet('You are redirected to the landing page');

heading3('Already Authenticated');
para('If a logged-in user navigates to /login, they are automatically redirected to their dashboard. The login page returns null (hidden) for authenticated sessions.');

// ===== 5. LANDING PAGE =====
heading1('5. Landing Page');
para('The landing page (/) is the public-facing homepage. It showcases the school\'s features, campus, team, and provides navigation to all sections through smooth-scroll anchor links.');

heading2('5.1 Hero Section');
para('The Hero section displays the school branding prominently:');
bullet('Badge: "Next-Gen Learning Platform" with sparkle icon');
bullet('Title: "Everest View Boarding School"');
bullet('Motto: "Unity of Nation & Purity of Knowledge" in italic serif font');
bullet('Description paragraph about the ERP system');
bullet('Two CTA buttons: "Get Started Free" (links to /login) and "Learn More" (scrolls to Team section)');
bullet('Animated counters (IntersectionObserver-based): 5000+ Students, 150+ Faculty, 45+ Awards');
bullet('Right side: School image with "Top Rated School" floating badge');

heading2('5.2 Features Section');
para('The Features section (/#features) highlights six core ERP modules in an animated card grid:');
bullet('Academic Dashboard — Real-time overview of attendance, grades, performance analytics, and progress tracking');
bullet('Attendance Management — Automated daily attendance system with student-wise and class-wise reports');
bullet('Examination System — Create exams, publish results, and generate report cards instantly');
bullet('Fee Management — Track payments, generate invoices, and manage due fees with automated alerts');
bullet('Learning Management — Upload assignments, study materials, and manage digital classrooms');
bullet('Notifications & Alerts — Instant SMS/email updates for attendance, results, and school announcements');
para('Each card has a gradient icon, title, description, hover animation, and color-coded accent (blue, green, indigo, amber, purple, red).');

heading2('5.3 About Section');
para('The About section (/#about) showcases the school campus and environment:');
bullet('Six feature cards: Experienced Faculty, Sports & Athletics, Science & Computer Labs, Library & Resource Center, Transportation, Smart Classrooms');
bullet('Testimonials carousel with ratings from parents, students, alumni, and teachers');
bullet('Each testimonial shows name, role, comment, image, and star rating');

heading2('5.4 Virtual Tour Section');
para('The Virtual Tour section (/#virtual-tour) provides an interactive 360° campus tour:');
bullet('Powered by Pannellum 360° viewer library');
bullet('Six location hotspots: School Gate, Playground, Canteen, Classroom, Principal Office, Library');
bullet('Auto-rotate with compass controls');
bullet('Click-and-drag navigation, click markers for details');
bullet('Right panel shows active location details and a list of all locations');
bullet('"Start Guided Tour" button auto-navigates through all locations');
bullet('Mobile-responsive with horizontal scrollable location bar');

heading2('5.5 Team Section');
para('The Team section (/#team) introduces key school personnel:');
bullet('Dr. Prajwal Gautam — Principal, 25+ years experience');
bullet('Mr. Nir Prasad Gautam — Academic Coordinator');
bullet('Mr. Prakash Thapa — Senior Teacher, Science');
bullet('Ms. Sevoke Chandra Gautam — Senior Teacher, Mathematics');
bullet('Each member displayed with a circular photo, name, role, and description.');

heading2('5.6 Contact Section');
para('The Contact section (/#contact) provides a communication form:');
bullet('Left column: Brand copy, "Connect with Us" badge, trust signals (24/7 Expert Support, <2hr Response Time), email and phone contact details');
bullet('Right column: Contact form with department selector (Admissions, Technical Support, General Inquiry), fields for name, email, and message');
bullet('Form submits to POST /api/contact with success/error feedback');
bullet('Floating badge: "Average response under 15 mins"');

// ===== 6. HEADER NAVIGATION =====
heading1('6. Header Navigation');
para('The Header component provides top navigation across the landing page and legal pages. It is fixed at the top with a backdrop blur effect that activates on scroll.');

heading2('Header Links');
bullet('Home — Scrolls to top of landing page');
bullet('Features — Scrolls to /#features section');
bullet('Virtual Tour — Scrolls to /#virtual-tour section');
bullet('About — Scrolls to /#about section');
bullet('Contact — Scrolls to /#contact section');

heading2('Authenticated State');
para('When logged in, the header shows:');
bullet('Dashboard link (role-specific: Owner/Teacher/Student Dashboard)');
bullet('User name and role badge');
bullet('Profile image button that opens a logout confirmation modal');

heading2('Unauthenticated State');
para('When not logged in, the header shows a "Sign In" button with a gradient style that links to /login.');

heading2('Mobile Navigation');
bullet('Hamburger menu button (Bars3Icon) appears on screens below lg breakpoint');
bullet('Slide-down animated mobile menu with all navigation links');
bullet('Auto-closes menu on link click');

heading2('Visibility Rules');
bullet('Header is hidden on the /login page (returns null)');
bullet('Logo shows full school name on desktop, truncated on mobile');

// ===== 7. FOOTER =====
heading1('7. Footer');
para('The Footer component provides school information, quick links, social media, legal links, and a newsletter subscription form.');

heading2('Footer Sections');
bullet('Brand Column — School logo, ERP description, and social media icons (Facebook, TikTok, YouTube)');
bullet('For Students — Quick links: Dashboard, Fee Details, Marksheet, Assignments, Class Routine');
bullet('For Teachers — Quick links: Dashboard, My Classes, Attendance, Marks Entry, Examinations');
bullet('Stay Updated — Newsletter subscription with email input and subscribe button');

heading2('Legal Links');
bullet('Privacy Policy — Links to /privacy');
bullet('Terms of Service — Links to /terms');
bullet('Cookie Policy — Links to /cookies');

heading2('Layout Behavior');
bullet('On mobile (grid-cols-1): Students and Teachers sections display side by side in a 2-column grid');
bullet('On desktop (md:grid-cols-4): Standard 4-column layout');
bullet('Footer is hidden on the /login page');

// ===== 8. OWNER DASHBOARD =====
heading1('8. Owner Dashboard');
para('The Owner Dashboard (/owner/dashboard) is the central command center for school administrators. It provides real-time analytics, quick actions, and system monitoring.');

heading2('Dashboard Components');
bullet('Greeting header — Time-based greeting (Good Morning/Afternoon/Evening) with Nepali date display');
bullet('KPI Stat Cards — Total Students, Total Teachers, Revenue, Average Attendance');
bullet('Grade-Wise Overview Cards — Each grade card shows student count, fee collection percentage, paid vs due amounts, and attendance percentage with color-coded indicators');
bullet('Fee Collection Radial Chart — Visual representation of total fee collection progress');
bullet('Attendance Overview — Bar chart showing attendance by grade level');
bullet('Financial Summary — Revenue breakdown and collection statistics');
bullet('Quick Action Buttons — Add Student, Add Teacher, Collect Fees, Manage Exams, Take Attendance, View Reports');
bullet('Recent Activity Feed — Chronological list of recent system events');
bullet('System Health Panel — CPU usage, memory usage, heap usage, uptime, database status');

heading2('Data Sources');
bullet('/api/owner/stats — Student/teacher counts, revenue, attendance');
bullet('/api/system-health — Server health metrics');

// ===== 9. STUDENT MANAGEMENT =====
heading1('9. Student Management');
para('The Student Management page (/owner/students) provides complete CRUD (Create, Read, Update, Delete) functionality for student records with bulk operations.');

heading2('Page Layout');
bullet('Header with total student count and grade distribution stats');
bullet('Promote All button — Moves all students to next grade (Grade 12 graduates)');
bullet('Search bar — Real-time filtering by student name or ID');
bullet('Grade filter dropdown — Filter display by grade');
bullet('Student table — Grouped by grade with attendance bars and action buttons');

heading2('Adding a Student (Modal Form)');
bullet('Full Name *');
bullet('Student ID *');
bullet('Email *');
bullet('Password *');
bullet('Grade * (dropdown: Grade 1-12)');
bullet('Section * (A/B/C/etc)');
bullet("Father's Name");
bullet("Father's Mobile");
bullet('Date of Birth (Nepali calendar picker)');
bullet('Address');
bullet('On submit: POST to /api/students, displays success toast');

heading2('Student Actions');
bullet('View Details — Modal showing all student info and payment history');
bullet('Edit — Modal to modify student fields and reset password');
bullet('Delete — Confirmation modal with red warning, DELETE request');

heading2('Bulk Operations');
bullet('Promote All — One-click promotion with confirmation modal');
bullet('Export CSV — Downloads filtered student data per grade');

heading2('Data Display');
bullet('Each student row shows: Avatar (initials), Name, Student ID, Grade/Section, Email, Attendance percentage bar, Action buttons');
bullet('Grade groups are collapsible/expandable sections');

// ===== 10. TEACHER MANAGEMENT =====
heading1('10. Teacher Management');
para('The Teacher Management page (/owner/teachers) allows the owner to manage all teacher records with full CRUD operations.');

heading2('Page Features');
bullet('Header with total teacher count and additional stats');
bullet('"Export CSV" and "Add Teacher" action buttons');
bullet('Search bar — Filter by name, email, or teacher ID');
bullet('Teacher table — Columns: Name, Email, Teacher ID, Actions');

heading2('Adding a Teacher (Modal)');
bullet('Fields: Name, Email, Teacher ID, Password');
bullet('POST to /api/teachers on submit');

heading2('Teacher Actions');
bullet('View Details — Displays full teacher profile in modal');
bullet('Edit — Update name, email, teacher ID, password');
bullet('Delete — Confirmation modal, DELETE request');
bullet('Export CSV — Download all teacher data');

// ===== 11. CLASS SCHEDULING =====
heading1('11. Class Scheduling');
para('The Class Scheduling page (/owner/classes) enables the owner to define and manage class schedules with teacher assignments.');

heading2('Core Features');
bullet('Add Class Schedule — Modal form with fields: Subject, Grade, Section, Time (e.g., "10:00 AM - 11:00 AM"), Room (e.g., "Room 101"), Teacher (dropdown from teacher list)');
bullet('Filters — Search by subject, filter by grade');
bullet('Schedule cards — Display subject, grade/section, time, room, assigned teacher');
bullet('Delete schedule — Confirmation modal');

heading2('Data Display');
bullet('Schedules displayed as styled cards');
bullet('Each card shows: Subject badge, Grade/Section, Time, Room number, Assigned teacher name');
bullet('Stats row: Total Classes, Assigned Teachers, Active Grades');

// ===== 12. ATTENDANCE MANAGEMENT =====
heading1('12. Attendance Management');
para('The Attendance Management page (/owner/attendance) provides a complete Bikram Sambat (Nepali) calendar-based attendance system with two views.');

heading2('Register View (Monthly Matrix)');
bullet('Monthly grid showing all students and all days of the selected Bikram Sambat month');
bullet('Each cell shows P (Present) or A (Absent) status');
bullet('Color-coded: Green for Present, Red for Absent');
bullet('Monthly attendance percentage per student');
bullet('Navigation: Previous/Next month arrows');
bullet('Grade selector to filter students');

heading2('Mark View (Per-Date)');
bullet('Select class/grade from dropdown');
bullet('Choose date using Nepali date picker (react-bs-calender)');
bullet('Student list with toggle buttons per row');
bullet('Bulk actions: "All Present" / "All Absent" buttons');
bullet('Click individual student to toggle P/A');
bullet('Submit button to save attendance');
bullet('Future date validation — prevents marking future attendance');

heading2('Attendance Statistics');
bullet('Total students in selected class');
bullet('Present count and percentage');
bullet('Absent count and percentage');

heading2('Technical Details');
bullet('Uses Bikram Sambat date utilities: adDateToBs, bsDateToAd, getBsMonthName, getDaysInBsMonth');
bullet('Attendance records stored with Nepali date fields');

// ===== 13. MARKS ENTRY & GRADING =====
heading1('13. Marks Entry & Grading');
para('The Marks Entry page (/owner/marks) provides a streamlined interface for entering and managing student marks with automatic grade computation.');

heading2('Grading Scale');
twoCol('90-100 → A+ (4.0)', '80-89 → A (3.6)');
twoCol('70-79 → B+ (3.2)', '60-69 → B (2.8)');
twoCol('50-59 → C+ (2.4)', '40-49 → C (2.0)');
twoCol('35-39 → D (1.6)', '0-34 → F (0.0)');

heading2('Marks Entry Interface');
bullet('Selectors: Exam Type (dropdown), Grade, Section, Subject');
bullet('Per-student marks input fields with keyboard navigation (Tab/Enter)');
bullet('Auto-grade display — Grade and GPA shown inline as you type');
bullet('Color-coded card borders based on marks range');
bullet('Save button — POST to /api/marks');
bullet('Success/error feedback via toast notification');

heading2('Data Flow');
bullet('Fetches class schedules and students on load');
bullet('Pre-fills existing marks if available for the selected exam/grade/subject');
bullet('Supports multiple subjects per exam');

// ===== 14. EXAMINATION MANAGEMENT =====
heading1('14. Examination Management');
para('The Examination Management page (/owner/exams) handles the complete exam lifecycle including scheduling, subject planning, and routine generation.');

heading2('Key Features');
bullet('Exam Terms: First Term, Second Term, Third Term');
bullet('Grade-specific exam schedules');
bullet('Subject management per exam: Subject name, exam date (Nepali), full marks, pass marks');
bullet('Add/remove subjects dynamically');
bullet('Exam routine view — Organized display by term and grade');

heading2('Creating an Exam');
bullet('Select term (First/Second/Third)');
bullet('Select grade');
bullet('Add subjects with name, date, full marks, and pass marks');
bullet('Auto-calculates totals and pass percentages');
bullet('Save creates exam routine; displays in organized cards');

heading2('Data Display');
bullet('Statistics: Total Exams, Active Grades, Subjects');
bullet('Exam cards grouped by term');
bullet('Each card shows: Grade, subjects list with dates, full/pass marks');

// ===== 15. FEE MANAGEMENT =====
heading1('15. Fee Management');
para('The Fee Management page (/owner/fees) is a comprehensive financial module with three tabs for structure definition, payment tracking, and transaction history.');

heading2('Tab 1: Fee Structure');
bullet('Define fee structures per grade');
bullet('Three terms: First Term, Second Term, End Term');
bullet('Four categories per term: Tuition, Transport, Exam, Other');
bullet('Auto-calculated term totals and grand total');
bullet('Card-based display per grade with term breakdowns');
bullet('Edit/Delete existing structures');

heading2('Tab 2: Overview');
bullet('Per-student fee summary table');
bullet('Columns: Student Name, Total Fee, Previous Due, Scholarship, Paid Amount, Due Amount, Status Badge');
bullet('Status badges: Paid (green), Partial (amber), Due (red)');
bullet('Action buttons per student:');
bullet('— Adjust: Override total fee, previous due, scholarship, paid amount fields');
bullet('— Pay: Record a payment with amount, date, and payment mode');
bullet('— History: View payment transaction history with amounts and dates');

heading2('Tab 3: History');
bullet('Complete payment transaction log');
bullet('Filter by date range using Nepali date picker');
bullet('Delete payment entries with confirmation');
bullet('Shows: Student name, amount, date, payment method');

heading2('Payment Integration');
bullet('Integration with eSewa payment gateway');
bullet('Students can pay fees online from their dashboard');
bullet('Payment status updates automatically');

// ===== 16. RESULTS & REPORT CARDS =====
heading1('16. Results & Report Cards');
para('The Results page (/owner/results) generates comprehensive academic results with printable report cards.');

heading2('Features');
bullet('Grade selector — Filter by grade/section');
bullet('Exam type selector — Choose term for result generation');
bullet('Automatic GPA calculation based on marks entered');
bullet('Pass/Fail determination per subject and overall');
bullet('Student-wise result summary: Name, Grade, Subjects with marks, Total, GPA, Grade, Result');
bullet('Print result — Print button generates a formatted report card layout');
bullet('Print styles inject custom CSS for clean paper output');

heading2('Result Computation');
bullet('GPA calculated from individual subject grades');
bullet('Overall grade assigned based on GPA range');
bullet('Result: Pass if all subjects meet pass marks criteria');

// ===== 17. SCHOOL REPORTS =====
heading1('17. School Reports');
para('The Reports page (/owner/reports) provides a high-level analytics dashboard with key school performance metrics.');

heading2('Report Metrics');
bullet('Total Students — Active enrollment count');
bullet('Total Teachers — Active teacher count');
bullet('Revenue Collected — Total fee collection amount');
bullet('Average Attendance — Overall attendance percentage');
bullet('Grade-wise performance breakdowns');

heading2('Data Source');
bullet('Fetches from /api/owner/stats endpoint');
bullet('Real-time data from database');

// ===== 18. NOTICE MANAGEMENT =====
heading1('18. Notice Management');
para('The Notice Management page (/owner/notices) enables the owner to create, publish, and manage digital notices with audience targeting.');

heading2('Compose Panel (Left)');
bullet('Title — Notice headline text input');
bullet('Content — Notice body textarea');
bullet('Image — Optional image upload with preview (base64 encoded)');
bullet('Expiry Date — Optional expiry date using Nepali date picker');
bullet('Target Audience — Radio selector: Everyone, Teachers, Students');
bullet('Publish button — Sends POST to /api/notices');

heading2('Notice List (Right)');
bullet('Recent notices displayed as cards');
bullet('Each card shows: Title, content preview, image thumbnail, audience badge (color-coded), expiry date');
bullet('Expired notices visually dimmed (opacity reduced)');
bullet('Delete button with confirmation modal');

heading2('Audience Badges');
bullet('Everyone → Blue badge');
bullet('Teachers → Purple badge');
bullet('Students → Emerald badge');

// ===== 19. PASSOUT STUDENTS =====
heading1('19. Passout Students');
para('The Passout Students page (/owner/passout) displays students who have graduated from the school.');

heading2('Features');
bullet('Automatic population from students marked with status="graduated"');
bullet('Batch grouping — Students grouped by graduation year');
bullet('Each batch shows: Graduation year, student count, student list with details');
bullet('Student cards display: Name, Grade at passout, Graduation year');
bullet('Stats: Total passout count');

heading2('Graduation Flow');
bullet('Students are marked as graduated via the "Promote All" function on the Student Management page when they are in Grade 12');
bullet('Once graduated, they appear in the Passout section');

// ===== 20. TEACHER DASHBOARD =====
heading1('20. Teacher Dashboard');
para('The Teacher Dashboard (/teacher/dashboard) provides educators with a personalized overview of their classes, students, and school notices.');

heading2('Dashboard Components');
bullet('Hero Header — Welcome message with teacher name and assigned class count');
bullet('Stats Row — My Classes, My Students, Grades Taught, Subjects');
bullet('Assigned Schedule — List of class schedules with subject, grade, time, and room');
bullet('My Students — Student avatars grouped by grade');
bullet('Class Performance Section — Grade selector to view attendance %, assignment completion %, and exam preparedness % per grade');
bullet('Recent Notices — Notice cards with dismiss button');

heading2('Data Sources');
bullet('/api/classes — Filtered by teacher email to show assigned classes');
bullet('/api/students — All students for reference');
bullet('/api/notices — Recent notices');
bullet('/api/teacher/stats — Performance statistics');

// ===== 21. TEACHER CLASSES =====
heading1('21. Teacher Classes');
para('The Teacher Classes page (/teacher/classes) displays the teacher\'s assigned class schedules with detailed student information.');

heading2('Features');
bullet('My Schedules — List of assigned classes with subject, grade, section, time, and room');
bullet('Grade-wise student cards — Each grade section shows enrolled students with avatars');
bullet('Stats: Total Classes, Total Students, Grades, Subjects');
bullet('Search — Filter students within each grade');

// ===== 22. TEACHER STUDENTS =====
heading1('22. Teacher Students');
para('The Teacher Students page (/teacher/students) helps teachers view the students connected to their assigned classes. It is designed for quick classroom reference and student lookup during daily teaching activities.');

heading2('Features');
bullet('Student list grouped by grade and section based on the teacher\'s assigned schedules');
bullet('Search support for locating students by name or student ID');
bullet('Student profile cards with basic academic and contact information');
bullet('Class-wise counts so teachers can quickly understand classroom size');
bullet('Read-focused access intended for classroom monitoring rather than full administration');

// ===== 23. TEACHER ATTENDANCE =====
heading1('23. Teacher Attendance');
para('The Teacher Attendance page (/teacher/attendance) allows teachers to mark attendance for their assigned classes using the Bikram Sambat calendar. Functionally similar to the owner attendance page but scoped to the teacher\'s assigned grades.');

heading2('Features');
bullet('Grade selector — Shows only grades assigned to the teacher');
bullet('Register View — Monthly attendance matrix with P/A indicators');
bullet('Mark View — Per-date marking interface with Nepali date picker');
bullet('Bulk actions: All Present / All Absent');
bullet('Attendance statistics per class');

// ===== 24. TEACHER EXAMS =====
heading1('24. Teacher Exams');
para('The Teacher Exams page (/teacher/exams) enables teachers to create and manage examinations for their assigned grades.');

heading2('Features');
bullet('Create exams with subject, date, full marks, pass marks');
bullet('Manage exam schedules per grade');
bullet('View existing exams in organized cards');
bullet('Routine display with subject timing');
bullet('Grade selector for filtering');

// ===== 25. TEACHER ASSIGNMENTS =====
heading1('25. Teacher Assignments');
para('The Teacher Assignments page (/teacher/assignments) allows teachers to create, distribute, and manage assignments for their classes.');

heading2('Creating an Assignment');
bullet('Title — Assignment name');
bullet('Description — Detailed instructions');
bullet('File Upload — Attach PDF or document files');
bullet('Due Date — Nepali date picker');
bullet('Grade selector — Target specific grades');
bullet('Publish — POST to /api/assignments');

heading2('Assignment Management');
bullet('List of published assignments with status');
bullet('View submissions per assignment');
bullet('Submission count and pending review count');
bullet('Delete assignments with confirmation');

// ===== 26. TEACHER MARKS ENTRY =====
heading1('26. Teacher Marks Entry');
para('The Teacher Marks page (/teacher/marks) provides the same marks entry interface as the owner version, scoped to the teacher\'s assigned subjects and grades.');

heading2('Features');
bullet('Select exam type, grade, section, and subject');
bullet('Per-student marks input with auto-grade computation');
bullet('Same grading scale as owner marks entry (A+ through F)');
bullet('Color-coded feedback based on marks range');
bullet('Save marks to /api/marks');

// ===== 27. TEACHER NOTICES =====
heading1('27. Teacher Notices');
para('The Teacher Notices page (/teacher/notices) gives teachers a dedicated notice board for school announcements, administrative updates, and classroom-related information.');

heading2('Features');
bullet('Displays notices targeted to teachers and notices targeted to everyone');
bullet('Shows title, content, image preview when available, audience label, and expiry information');
bullet('Expired notices are visually separated from active notices where applicable');
bullet('Teachers can review recent school communications without using owner administration screens');

// ===== 28. STUDENT DASHBOARD =====
heading1('28. Student Dashboard');
para('The Student Dashboard (/student/dashboard) gives students a personalized view of their academic performance, attendance, fees, and assignments.');

heading2('Dashboard Components');
bullet('Stats Row: Attendance %, Average Score, Fee Status (Paid/Due), Pending Assignments');
bullet('Quick Link Cards: Marksheet, Assignments, Routine, Fees (each navigates to respective page)');
bullet('Attendance Calendar — Interactive monthly grid with color-coded days:');
bullet('— Present: Green checkmark');
bullet('— Absent: Red X mark');
bullet('— No Record: Gray dash');
bullet('Month navigation arrows for calendar');
bullet('Upcoming Exams — List of scheduled exams with dates');
bullet('Quick Info Sidebar: Student name, ID, grade, email');
bullet('Performance Radial Chart — Overall score visualization');
bullet('Recent Assignments — List with submission status');

heading2('Data Sources');
bullet('/api/attendance, /api/marks, /api/assignments, /api/fees, /api/exam-routines, /api/notices');

// ===== 29. STUDENT MARK SHEET =====
heading1('29. Student Marksheet');
para('The Student Marksheet page (/student/marksheet) displays detailed academic results for the logged-in student.');

heading2('Features');
bullet('Exam type selector — Filter by term/exam type');
bullet('Student info header — Name, Grade, Student ID');
bullet('Subject-wise marks table with columns: Subject, Marks Obtained, Full Marks, Pass Marks, Percentage, Grade, Remarks');
bullet('Results summary: Total marks, GPA, Overall Grade, Result (Pass/Fail)');
bullet('Automatic grade computation with color-coded remarks:');
twoCol('A+ (90-100): Outstanding', 'A (80-89): Excellent');
twoCol('B+ (70-79): Very Good', 'B (60-69): Good');
twoCol('C+ (50-59): Satisfactory', 'C (40-49): Pass');
twoCol('D (Below 40): Fail', '');

// ===== 30. STUDENT ASSIGNMENTS =====
heading1('30. Student Assignments');
para('The Student Assignments page (/student/assignments) allows students to view and submit assignments.');

heading2('Features');
bullet('Assignment list with title, description, due date, and file attachment');
bullet('Status indicators: Pending, Submitted, Graded');
bullet('Submit assignment — Upload file with optional notes');
bullet('View assignment PDF/files inline');
bullet('Submission confirmation with toast notification');

// ===== 31. STUDENT ROUTINE =====
heading1('31. Student Routine');
para('The Student Routine page (/student/routine) displays the exam timetable for the student\'s grade. It uses both the Bikram Sambat and Gregorian date systems.');

heading2('Features');
bullet('Automatic grade detection from student session');
bullet('Exam routine organized by term');
bullet('Subject-wise schedule with date, time, and full marks');
bullet('Bilingual date display (Nepali and English)');
bullet('Print-friendly layout');

// ===== 32. STUDENT FEES =====
heading1('32. Student Fees');
para('The Student Fees page (/student/fees) allows students to view their fee status and make online payments via eSewa.');

heading2('Features');
bullet('Fee Summary — Total fee, paid amount, due amount, scholarship');
bullet('Fee structure breakdown by term and category');
bullet('Payment modes: Full Payment or Partial Payment');
bullet('eSewa Integration — Click "Pay with eSewa" to initiate online payment');
bullet('Payment history — List of all past transactions');
bullet('Payment status messages — Success/failed/error from eSewa callback');
bullet('Receipt printing — Print button for payment receipts');

heading2('Payment Flow');
bullet('Student selects pay mode (full or partial)');
bullet('Enters amount for partial payment');
bullet('Clicks "Pay with eSewa"');
bullet('eSewa form auto-submits to payment gateway');
bullet('On success: Redirected back with ?payment=success');
bullet('Fee status automatically updated');

// ===== 33. LEGAL PAGES =====
heading1('33. Legal Pages');

heading2('Privacy Policy (/privacy)');
para('The Privacy Policy page outlines how the school collects, uses, stores, and protects user data. Sections include: Information We Collect, How We Use Your Information, Data Sharing, Data Security, Your Rights, and Contact Information. Last updated: June 2026.');

heading2('Terms of Service (/terms)');
para('The Terms of Service page defines the terms for using the ERP system. Sections include: Acceptance of Terms, Account Responsibilities, Acceptable Use, Service Availability, Limitation of Liability, and Termination. Last updated: June 2026.');

heading2('Cookie Policy (/cookies)');
para('The Cookie Policy page explains cookie usage on the platform. Sections include: What Are Cookies, How We Use Cookies (Essential, Preference, Analytics), Types of Cookies, Managing Cookies, Third-Party Cookies, and Updates. Last updated: June 2026.');

// ===== 34. API REFERENCE =====
heading1('34. API Reference');
para('The system provides a comprehensive RESTful API for all operations. Key endpoints:');

const apis = [
  ['Authentication', '/api/auth/[...nextauth]', 'NextAuth authentication handler'],
  ['Current User', '/api/me', 'Get current authenticated user data'],
  ['Students', '/api/students', 'Student CRUD operations'],
  ['Promote Students', '/api/students/promote', 'Batch promote all students to next grade'],
  ['Teachers', '/api/teachers', 'Teacher CRUD operations'],
  ['Classes', '/api/classes', 'Class schedule management'],
  ['Attendance', '/api/attendance', 'Attendance marking and retrieval'],
  ['Marks', '/api/marks', 'Marks entry and retrieval'],
  ['Class Fees', '/api/class-fees', 'Fee structure per grade'],
  ['Fees', '/api/fees', 'Student fee management and payments'],
  ['Exams', '/api/exams', 'Examination management'],
  ['Exam Routines', '/api/exam-routines', 'Exam timetable by grade/student'],
  ['Assignments', '/api/assignments', 'Assignment CRUD and distribution'],
  ['Submissions', '/api/submissions', 'Student assignment submissions'],
  ['Lesson Plans', '/api/lessonplans', 'Lesson plan management'],
  ['Notices', '/api/notices', 'Notice CRUD and publishing'],
  ['Notifications', '/api/notifications', 'User notifications'],
  ['Contact', '/api/contact', 'Contact form submissions'],
  ['Subscribe', '/api/subscribe', 'Newsletter subscription'],
  ['Unsubscribe', '/api/unsubscribe', 'Newsletter unsubscription'],
  ['eSewa Initiate', '/api/esewa/initiate', 'Initialize eSewa payment'],
  ['eSewa Success', '/api/esewa/success', 'eSewa payment callback'],
  ['Owner Stats', '/api/owner/stats', 'Owner dashboard statistics'],
  ['Teacher Stats', '/api/teacher/stats', 'Teacher dashboard statistics'],
  ['System Health', '/api/system-health', 'Server health and metrics'],
];

doc.save();
apis.forEach(([category, endpoint, desc]) => {
  doc.fontSize(9).fillColor(secondaryColor).font('Helvetica-Bold');
  doc.text(category, 55, doc.y, { width: 80 });
  doc.fontSize(9).fillColor(primaryColor).font('Helvetica');
  doc.text(endpoint, 140, doc.y, { width: 120 });
  doc.fontSize(9).fillColor(grayColor).font('Helvetica');
  doc.text(desc, 270, doc.y, { width: (doc.page.width - 330) });
  doc.moveDown(0.4);
});
doc.restore();

// ===== 35. TECHNICAL ARCHITECTURE =====
heading1('35. Technical Architecture');

heading2('Directory Structure');
para('The application follows Next.js 16 App Router conventions:');
bullet('src/app/ — Page routes and API routes');
bullet('src/app/components/ — Shared UI components (Header, Footer, Sidebar, LayoutWrapper, landing sections)');
bullet('src/app/api/ — RESTful API route handlers');
bullet('src/lib/ — Utility functions (nepaliDate, authOptions, database connection)');
bullet('public/ — Static assets (images, fonts)');
bullet('scripts/ — Utility scripts');

heading2('Authentication Flow');
bullet('NextAuth.js with Credentials provider');
bullet('Users authenticate via email/ID and password');
bullet('Session contains: user name, email, role, studentId (if student), grade (if student)');
bullet('Middleware protects /owner/*, /teacher/*, /student/* routes');
bullet('Individual pages also enforce role-based access with redirects');

heading2('Database');
bullet('MongoDB with Mongoose ODM');
bullet('Collections: users, students, teachers, classes, attendance, marks, fees, exams, assignments, submissions, notices');

heading2('Date System');
bullet('Dual date support: Gregorian (AD) and Bikram Sambat (BS/Nepali)');
bullet('Nepali date utilities in src/lib/nepaliDate.js');
bullet('react-bs-calender library for Nepali date picker components');

// ===== 36. SUPPORT =====
heading1('36. Support');

infoBox('Contact Information', [
  'Email: support@everestview.edu.np',
  'Phone: +977 1-4567890',
  'Response Time: Average under 15 minutes during school hours',
  'Technical Support: Available via Contact form on landing page',
]);

para('For technical support, account issues, or feature requests, please contact the school administration through any of the channels above. Our team is committed to providing timely assistance.');

// ===== FINAL PAGE =====
doc.addPage();
addFooter();
doc.save();
doc.fontSize(28).fillColor(secondaryColor).font('Helvetica-Bold');
doc.text('Thank You', 55, 200, { align: 'center' });
doc.moveDown(1);
doc.fontSize(12).fillColor(grayColor).font('Helvetica');
doc.text('This user guide covers all features and functionality of the Everest View ERP system.', 55, 260, { align: 'center', width: doc.page.width - 110 });
doc.text('For additional assistance, please contact your school administrator.', 55, 285, { align: 'center', width: doc.page.width - 110 });
doc.moveDown(3);
doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold');
doc.text('Everest View Secondary Boarding School', 55, 370, { align: 'center', width: doc.page.width - 110 });
doc.fontSize(9).fillColor(grayColor).font('Helvetica');
doc.text('ERP — School Management System', 55, 390, { align: 'center', width: doc.page.width - 110 });
doc.text('Kathmandu, Nepal', 55, 405, { align: 'center', width: doc.page.width - 110 });
doc.restore();

doc.end();
