const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const title = 'Everest View ERP - Pre-Development Research Document';
const outputPath = path.join(__dirname, '..', 'Everest_View_ERP_Pre_Development_Research_Document.pdf');
const publicOutputPath = path.join(__dirname, '..', 'public', 'Everest_View_ERP_Pre_Development_Research_Document.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 58, bottom: 62, left: 55, right: 55 },
  bufferPages: true,
  info: {
    Title: title,
    Author: 'Everest View Secondary Boarding School',
    Subject: 'Research document prepared before development of the ERP School Management System',
    Keywords: 'ERP, school management system, research, requirements, feasibility, pre-development',
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
  sky: '#38BDF8',
  gray: '#64748B',
  light: '#F1F5F9',
  border: '#CBD5E1',
  green: '#047857',
};

let pageNumber = 1;

function footer() {
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
  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').fontSize(21).fillColor(colors.navy).text(text);
  doc.moveDown(0.25);
  doc.rect(55, doc.y, 72, 4).fill(colors.blue);
  doc.moveDown(1.1);
}

function h2(text) {
  ensureSpace(55);
  doc.moveDown(0.7);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.blue).text(text);
  doc.moveDown(0.35);
}

function h3(text) {
  ensureSpace(42);
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

function infoBox(titleText, lines) {
  ensureSpace(50 + lines.length * 18);
  const x = 55;
  const y = doc.y;
  const width = doc.page.width - 110;
  const height = 28 + lines.length * 18;
  doc.save();
  doc.rect(x, y, width, height).fill(colors.light).stroke(colors.border);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.blue).text(titleText, x + 12, y + 9, {
    width: width - 24,
  });
  doc.font('Helvetica').fontSize(9).fillColor(colors.navy);
  lines.forEach((line, index) => {
    doc.text(`- ${line}`, x + 16, y + 30 + index * 18, { width: width - 32 });
  });
  doc.restore();
  doc.y = y + height + 14;
}

function row(label, value) {
  ensureSpace(30);
  const x = 55;
  const y = doc.y;
  const labelWidth = 155;
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

function sectionList(titleText, items) {
  h2(titleText);
  items.forEach(bullet);
}

// Cover page
doc.save();
doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.navy);
doc.rect(0, 0, doc.page.width, 8).fill(colors.blue);
doc.font('Helvetica-Bold').fontSize(32).fillColor('#FFFFFF').text('ERP School', 55, 155);
doc.font('Helvetica-Bold').fontSize(28).fillColor('#FFFFFF').text('Pre-Development', 55, 198);
doc.font('Helvetica-Bold').fontSize(28).fillColor('#FFFFFF').text('Research Document', 55, 235);
doc.font('Helvetica').fontSize(14).fillColor(colors.sky).text('Research before development of the school management system', 55, 292);
doc.rect(55, 328, 92, 4).fill(colors.blue);
doc.font('Helvetica').fontSize(10).fillColor('#CBD5E1').text('Prepared for: Everest View Secondary Boarding School', 55, 365);
doc.text('Project: Everest View ERP / Student ERP', 55, 383);
doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 55, 401);
doc.font('Helvetica').fontSize(9).fillColor('#94A3B8').text('Document Type: Research, feasibility, scope, and requirements study', 55, doc.page.height - 88, {
  width: doc.page.width - 110,
  align: 'center',
});
doc.text('Confidential - For academic and project documentation use', 55, doc.page.height - 66, {
  width: doc.page.width - 110,
  align: 'center',
});
doc.restore();

// Table of contents
h1('Table of Contents');
[
  '1. Executive Summary',
  '2. Background Study',
  '3. Research Purpose and Methodology',
  '4. Problem Statement',
  '5. Stakeholder Analysis',
  '6. Current Process Study',
  '7. Proposed Solution Overview',
  '8. Scope of the System',
  '9. Functional Requirement Research',
  '10. Non-Functional Requirement Research',
  '11. Module Research',
  '12. Data and Information Research',
  '13. Technology Feasibility Study',
  '14. Security, Privacy, and Compliance Research',
  '15. Risk Analysis and Mitigation',
  '16. Testing and Quality Strategy',
  '17. Development Roadmap',
  '18. Expected Benefits and Success Metrics',
  '19. Conclusion and Recommendation',
  '20. Appendix',
].forEach((item) => {
  doc.font('Helvetica').fontSize(10.5).fillColor(colors.navy).text(item, { lineGap: 6, indent: 12 });
});

h1('1. Executive Summary');
para('This research document presents the pre-development study for the Everest View ERP School Management System. The purpose of the research is to understand the academic, administrative, financial, and communication needs of a school before developing the software solution. The research identifies user roles, operational problems, desired modules, technology choices, feasibility factors, data requirements, risks, and expected benefits.');
para('The proposed ERP system is intended to centralize school operations through a role-based web application for owners or administrators, teachers, and students. The system supports student management, teacher management, attendance, class schedules, marks, examinations, fee records, online payment support, assignments, notices, reports, and student self-service.');
infoBox('Research Outcome', [
  'A web-based ERP system is feasible and suitable for the school environment.',
  'Role-based access is essential to separate owner, teacher, and student responsibilities.',
  'Digital attendance, fee tracking, result generation, and notices should be treated as core modules.',
  'The system should support local context such as Bikram Sambat date usage and eSewa payment flow.',
]);

h1('2. Background Study');
para('School administration involves continuous management of academic records, student information, teacher responsibilities, fee collection, examinations, reports, and communication. In many schools, these activities are handled through paper registers, spreadsheets, verbal communication, and separate files. This creates duplication of effort and increases the chance of missing, inconsistent, or delayed information.');
para('A school ERP system provides a single digital platform where school data can be stored, processed, and viewed according to user role. Before development, it is necessary to research the institution, its workflows, users, technology environment, security needs, and operational constraints. This document records that research and converts it into practical development direction.');
sectionList('Context of the Project', [
  'The project is a school management ERP for Everest View Secondary Boarding School.',
  'The application is designed as a modern web system accessible through browsers.',
  'The expected users are school owners or administrators, teachers, and students.',
  'The system should reduce manual work and improve transparency in academic and financial operations.',
]);

h1('3. Research Purpose and Methodology');
para('The main purpose of the research is to define what should be developed, why it should be developed, who will use it, and how the system should support the school. The research is prepared before development so the implementation can follow a clear scope rather than adding features randomly.');
h2('Research Objectives');
numbered([
  'Identify the major problems in current school administration workflows.',
  'Define the user roles and their responsibilities in the ERP system.',
  'Study the required modules for academic, administrative, and financial management.',
  'Select a practical technology stack suitable for a secure web-based ERP.',
  'Analyze risks, limitations, and feasibility before development starts.',
  'Prepare a clear foundation for design, development, testing, and deployment.',
]);
h2('Research Methodology');
bullet('Requirement observation: studying common school workflows such as admission, attendance, fees, results, and notices.');
bullet('Stakeholder analysis: identifying the needs of administrators, teachers, and students.');
bullet('Feature comparison: reviewing common ERP modules required by schools.');
bullet('Technical analysis: evaluating web technologies, database options, authentication, and payment integration.');
bullet('Risk analysis: identifying possible operational and technical issues before development.');

h1('4. Problem Statement');
para('The school requires a centralized system to manage academic and administrative activities efficiently. Without an integrated system, staff may need to maintain separate records for students, teachers, attendance, marks, fees, assignments, and notices. This can cause delays, data duplication, limited reporting, and difficulty in tracking student progress.');
sectionList('Major Problems Identified', [
  'Student records may be scattered across registers, spreadsheets, and individual files.',
  'Attendance calculation can be slow and prone to manual mistakes.',
  'Fee collection status may not be instantly visible to the administration or students.',
  'Result preparation requires repeated calculation and formatting work.',
  'Teachers need an easier way to access assigned classes, mark attendance, and enter marks.',
  'Students need self-service access to assignments, routines, marksheets, and fee status.',
  'Communication through notices may not reach the correct audience on time.',
]);
infoBox('Core Research Question', [
  'How can a school ERP system centralize administrative, academic, and financial workflows while remaining simple enough for daily use by owners, teachers, and students?',
]);

h1('5. Stakeholder Analysis');
para('A successful ERP system must be designed around the people who will use it. The pre-development research identifies three primary stakeholder groups: owner or administrator, teachers, and students. Each group requires a separate dashboard, limited permissions, and workflows matched to their responsibilities.');
h2('Owner or Administrator');
bullet('Needs complete control over students, teachers, classes, fees, exams, results, reports, notices, and passout records.');
bullet('Requires dashboards with key performance indicators such as total students, total teachers, fee collection, and attendance percentage.');
bullet('Needs accurate reports for decision making and monitoring school performance.');
h2('Teacher');
bullet('Needs access to assigned classes, students, attendance marking, examinations, assignments, marks entry, and notices.');
bullet('Requires a simple classroom-focused interface to reduce administrative burden.');
bullet('Should not have unrestricted access to owner-level financial or management settings.');
h2('Student');
bullet('Needs access to personal dashboard, marksheet, assignments, class or exam routine, and fee information.');
bullet('Requires a clear and mobile-friendly interface for self-service information.');
bullet('Should only view personal academic and financial records.');

h1('6. Current Process Study');
para('Before software development, the current school management process must be understood. The study assumes a common school workflow where administrative staff maintain student and fee records, teachers maintain attendance and marks, and students depend on office communication for information.');
h2('Manual or Semi-Digital Process Limitations');
bullet('Student enrollment and updates require repeated manual entry.');
bullet('Attendance registers need manual counting for monthly or yearly reports.');
bullet('Fee records can become difficult to reconcile when partial payments, previous dues, and scholarships exist.');
bullet('Exam results require manual calculation of grades, GPA, pass or fail status, and report cards.');
bullet('Notices may be shared through boards or informal channels, making tracking difficult.');
h2('Opportunity for Digital Improvement');
bullet('Store all records in one database.');
bullet('Use dashboards to display real-time academic and financial status.');
bullet('Automate grade calculation and report generation.');
bullet('Provide student and teacher portals for direct access to relevant information.');

h1('7. Proposed Solution Overview');
para('The proposed solution is a web-based school ERP system with role-based access. The system will provide separate dashboards for the owner, teacher, and student. It will centralize records, automate calculations, reduce paperwork, and improve communication between the school and its users.');
h2('Proposed System Characteristics');
bullet('Web-based application accessible from desktop, tablet, and mobile browsers.');
bullet('Authentication system using credentials and secure sessions.');
bullet('MongoDB database for storing academic, administrative, and financial records.');
bullet('Owner module for complete school administration.');
bullet('Teacher module for classroom and academic responsibilities.');
bullet('Student module for self-service academic and fee information.');
bullet('Public landing page for school presentation and contact.');
h2('Expected System Users');
row('Owner/Admin', 'Manages complete ERP operations and monitors school performance.');
row('Teacher', 'Handles assigned class activities including attendance, exams, assignments, and marks.');
row('Student', 'Views personal dashboard, assignments, marksheet, routine, and fees.');

h1('8. Scope of the System');
para('Scope definition is important before development because it prevents uncontrolled feature expansion. The ERP should first focus on the essential operations required for academic administration and then support future enhancements if needed.');
h2('In Scope');
bullet('Student record management from enrollment to passout.');
bullet('Teacher record management.');
bullet('Class schedule creation and teacher assignment.');
bullet('Attendance marking and attendance reports using Bikram Sambat dates.');
bullet('Marks entry, grade calculation, and student marksheet.');
bullet('Exam and routine management.');
bullet('Fee structure, fee payment records, dues, scholarships, and eSewa payment support.');
bullet('Assignments and submissions.');
bullet('Digital notices targeted to users.');
bullet('Dashboards, reports, and system health monitoring.');
h2('Out of Scope for Initial Development');
bullet('Biometric attendance hardware integration.');
bullet('Transport GPS tracking.');
bullet('Library book circulation automation.');
bullet('Payroll and human resource management.');
bullet('Mobile native applications for Android and iOS.');
bullet('Advanced AI-based student performance prediction.');

h1('9. Functional Requirement Research');
para('Functional requirements define what the system must do. The following requirements were identified as necessary before development.');
h2('Authentication and Authorization');
bullet('Users must log in with an email, teacher ID, or student ID and password.');
bullet('The system must redirect users to dashboards based on role.');
bullet('Protected routes must not be accessible without login.');
bullet('Role permissions must prevent students and teachers from accessing owner modules.');
h2('Owner Requirements');
bullet('Create, view, update, delete, search, and export students and teachers.');
bullet('Promote students and maintain passout records.');
bullet('Create class schedules and assign teachers.');
bullet('Manage attendance, exams, marks, fees, results, reports, and notices.');
h2('Teacher Requirements');
bullet('View assigned classes and related students.');
bullet('Mark attendance for assigned grades.');
bullet('Create or manage exams and assignments.');
bullet('Enter marks for relevant classes and subjects.');
bullet('Read notices targeted to teachers or everyone.');
h2('Student Requirements');
bullet('View dashboard summary including attendance, average marks, fee status, and pending assignments.');
bullet('View marksheet and exam routine.');
bullet('View and submit assignments.');
bullet('View fee structure, due amount, payment history, and online payment option.');

h1('10. Non-Functional Requirement Research');
para('Non-functional requirements define the quality attributes of the ERP system. Since the ERP handles important school data, the system must be reliable, secure, responsive, and easy to use.');
h2('Usability');
bullet('The interface should be clean and understandable for non-technical school users.');
bullet('Common actions such as adding students, marking attendance, and recording fees should require minimum steps.');
bullet('The design must be responsive for mobile and desktop users.');
h2('Performance');
bullet('Dashboard data should load quickly for normal school database sizes.');
bullet('Search and filtering should work without unnecessary page reloads.');
bullet('API endpoints should return only required data where possible.');
h2('Reliability');
bullet('Important forms should provide validation and clear error messages.');
bullet('The system should prevent invalid actions such as marking future attendance.');
bullet('Payment callback processing should handle failed, cancelled, and successful states.');
h2('Maintainability');
bullet('The codebase should use clear route structure, reusable components, and separated models.');
bullet('Business rules such as grading and date conversion should be placed in utilities where practical.');

h1('11. Module Research');
para('The project is divided into modules to keep development organized. Each module supports a specific school process and connects with related modules through shared data.');
h2('Owner Modules');
bullet('Dashboard: summary of students, teachers, attendance, revenue, and system health.');
bullet('Student Management: student CRUD, grade grouping, search, CSV export, promotion, and passout flow.');
bullet('Teacher Management: teacher CRUD, search, and export.');
bullet('Classes: subject schedules, rooms, timings, grades, sections, and teacher assignments.');
bullet('Attendance: monthly register view and per-date marking view.');
bullet('Marks and Results: marks entry, grading, GPA, pass/fail, and report card preparation.');
bullet('Fees: fee structure, student fee summary, adjustments, payment history, and online payment support.');
bullet('Notices: targeted communication for everyone, teachers, or students.');
h2('Teacher Modules');
bullet('Dashboard: overview of assigned classes, students, notices, and performance data.');
bullet('Classes and Students: view assigned schedules and student lists.');
bullet('Attendance: mark and review attendance for assigned grades.');
bullet('Exams, Assignments, and Marks: manage classroom evaluation activities.');
bullet('Notices: read school announcements relevant to teachers.');
h2('Student Modules');
bullet('Dashboard: attendance, average score, fee status, and pending assignment summary.');
bullet('Marksheet: subject marks, GPA, grade, and result status.');
bullet('Assignments: view tasks and submit work.');
bullet('Routine: view exam schedule for the student grade.');
bullet('Fees: view dues, payment history, and pay through eSewa where available.');

h1('12. Data and Information Research');
para('The ERP requires structured data models to support reliable operations. Each model should represent a real school entity and contain fields that support reporting and workflow automation.');
h2('Key Data Entities');
row('Student', 'Name, student ID, email, password hash, grade, section, parent information, date of birth, address, status, and fee references.');
row('Teacher', 'Name, email, teacher ID, password hash, assigned schedules, and profile information.');
row('Class Schedule', 'Subject, grade, section, time, room, and assigned teacher.');
row('Attendance', 'Student, grade, section, date, Bikram Sambat date fields, and present or absent status.');
row('Exam', 'Term, grade, subjects, date, full marks, and pass marks.');
row('Mark', 'Student, exam type, subject, marks obtained, grade, GPA, and result calculation data.');
row('Fee and Payment', 'Fee structure, previous due, scholarship, paid amount, payment mode, transaction date, and payment status.');
row('Notice', 'Title, content, image, expiry date, target audience, and publish status.');
h2('Data Quality Requirements');
bullet('Unique IDs should be enforced for students and teachers.');
bullet('Required fields should be validated before saving.');
bullet('Financial data should preserve payment history and not only final balance.');
bullet('Attendance and marks must be connected to the correct student, grade, section, and date or exam.');

h1('13. Technology Feasibility Study');
para('The selected technology stack should support fast development, secure authentication, responsive user interfaces, server-side API routes, and a flexible database. The existing project direction uses modern JavaScript web technologies suitable for this ERP.');
h2('Recommended Technology Stack');
row('Frontend and Backend Framework', 'Next.js with App Router for pages, layouts, middleware, and API route handlers.');
row('User Interface', 'React for component-based UI and Tailwind CSS for responsive styling.');
row('Database', 'MongoDB with Mongoose for flexible document models and rapid development.');
row('Authentication', 'NextAuth.js with credentials provider and role-based sessions.');
row('PDF Documentation', 'PDFKit for generating project documentation PDFs.');
row('Testing', 'Cypress for end-to-end testing of owner, teacher, student, public, and API flows.');
h2('Feasibility Result');
bullet('Technical feasibility is high because the chosen stack supports the required web ERP features.');
bullet('Operational feasibility is high if users receive basic training and interfaces stay simple.');
bullet('Economic feasibility is practical because the system can reduce administrative time and paper-based work.');
bullet('Schedule feasibility depends on disciplined scope control and phased development.');

h1('14. Security, Privacy, and Compliance Research');
para('The ERP will store sensitive student, teacher, academic, and financial data. Security and privacy must be considered before development, not added only after implementation.');
h2('Security Requirements');
bullet('Passwords must be stored as hashes, never as plain text.');
bullet('All dashboard routes must require authentication.');
bullet('Authorization must verify user role before showing protected features.');
bullet('Payment status updates must be validated through the payment provider callback process.');
bullet('Input validation must be applied to forms and API routes.');
h2('Privacy Requirements');
bullet('Students should only see their own personal academic and fee records.');
bullet('Teachers should only access class and academic information needed for their work.');
bullet('Owner access should be protected because it includes administrative and financial operations.');
bullet('Public pages should not expose private school records.');
h2('Documentation and Legal Pages');
bullet('Privacy Policy should explain data collection, usage, storage, sharing, and user rights.');
bullet('Terms of Service should define acceptable use and account responsibility.');
bullet('Cookie Policy should explain essential and optional cookies used by the platform.');

h1('15. Risk Analysis and Mitigation');
para('Risk analysis helps the project team prepare for issues before development and deployment. The following risks were identified during the research phase.');
row('Requirement Creep', 'Risk: adding too many features during development. Mitigation: define core scope and develop in phases.');
row('Data Entry Errors', 'Risk: incorrect student, marks, attendance, or fee data. Mitigation: use validation, confirmations, and clear edit flows.');
row('Role Misuse', 'Risk: users accessing features outside their responsibility. Mitigation: enforce middleware and page-level role checks.');
row('Payment Failure', 'Risk: online payments may fail or callbacks may be interrupted. Mitigation: handle success, failure, cancelled, and error states clearly.');
row('User Adoption', 'Risk: staff may prefer manual records. Mitigation: provide simple UI, training, and gradual transition.');
row('Data Loss', 'Risk: accidental deletion or system failure. Mitigation: maintain backups and confirmation modals for destructive actions.');

h1('16. Testing and Quality Strategy');
para('Testing should be planned before development to ensure the ERP works correctly for all roles and modules. Since this system handles academic and financial data, both functional testing and workflow testing are important.');
h2('Testing Areas');
bullet('Authentication tests for login, logout, invalid credentials, and role redirects.');
bullet('Owner workflow tests for students, teachers, classes, attendance, marks, fees, exams, notices, and reports.');
bullet('Teacher workflow tests for classes, students, attendance, assignments, exams, marks, and notices.');
bullet('Student workflow tests for dashboard, marksheet, assignments, routine, and fees.');
bullet('API tests for important endpoints and validation behavior.');
bullet('Responsive layout testing on desktop and mobile screen sizes.');
h2('Quality Goals');
bullet('The system should be understandable without technical guidance for common tasks.');
bullet('Errors should be visible and useful to users.');
bullet('Critical actions should have confirmation dialogs where needed.');
bullet('Generated reports and records should match database values accurately.');

h1('17. Development Roadmap');
para('The research recommends phased development. This reduces risk and allows the school to begin using core modules before advanced features are expanded.');
h2('Phase 1: Foundation');
bullet('Set up project structure, database connection, authentication, roles, layout, and navigation.');
bullet('Create base models for students, teachers, schedules, attendance, marks, fees, exams, assignments, and notices.');
h2('Phase 2: Owner Core Modules');
bullet('Develop student management, teacher management, classes, attendance, marks, exams, fees, notices, reports, and passout flow.');
h2('Phase 3: Teacher Portal');
bullet('Develop teacher dashboard, assigned classes, student view, attendance, exams, assignments, marks, and notices.');
h2('Phase 4: Student Portal');
bullet('Develop student dashboard, marksheet, assignments, routine, and fee view with eSewa payment flow.');
h2('Phase 5: Testing, Documentation, and Deployment');
bullet('Run end-to-end testing, fix issues, prepare documentation, generate PDFs, and deploy for real use.');

h1('18. Expected Benefits and Success Metrics');
para('The ERP should provide measurable benefits to the school after development and adoption. These benefits should be evaluated using practical success metrics.');
h2('Expected Benefits');
bullet('Reduced paperwork and repeated manual data entry.');
bullet('Faster access to student, attendance, fee, and result information.');
bullet('Improved accuracy in marks, GPA, fee dues, and attendance reports.');
bullet('Better communication through targeted notices.');
bullet('Improved transparency for students through self-service access.');
bullet('Better administrative decision making through dashboards and reports.');
h2('Success Metrics');
row('Administrative Efficiency', 'Time required to create reports, results, and fee summaries should decrease.');
row('Data Accuracy', 'Manual calculation errors in marks, fee dues, and attendance should reduce.');
row('User Adoption', 'Owners, teachers, and students should use role dashboards regularly.');
row('Communication Speed', 'Notices and assignment updates should reach intended users faster.');
row('Financial Visibility', 'Due, paid, scholarship, and transaction history should be easily available.');

h1('19. Conclusion and Recommendation');
para('The pre-development research shows that a school ERP system is necessary and feasible for managing the academic, administrative, and financial activities of Everest View Secondary Boarding School. The system should be developed as a secure role-based web application that centralizes student records, teacher responsibilities, attendance, marks, exams, fees, assignments, notices, and reports.');
para('The recommended approach is to build the ERP in phases, beginning with authentication, database models, and owner modules, then expanding to teacher and student portals. Development should remain focused on the defined scope, with attention to usability, data accuracy, security, and testing.');
infoBox('Final Recommendation', [
  'Proceed with development using the researched scope and role-based module structure.',
  'Prioritize core academic and administrative workflows before optional advanced features.',
  'Maintain clear documentation and testing throughout the development process.',
]);

h1('20. Appendix');
h2('Glossary');
row('ERP', 'Enterprise Resource Planning system used to manage organizational processes in one platform.');
row('Owner', 'The school administrator role with full control over ERP operations.');
row('Teacher Portal', 'The section of the ERP used by teachers for assigned academic work.');
row('Student Portal', 'The section of the ERP used by students to view personal academic and fee information.');
row('Bikram Sambat', 'The Nepali calendar system used for attendance, exams, and local date workflows.');
row('eSewa', 'A digital payment gateway used for online fee payment support.');
h2('Pre-Development Checklist');
bullet('Confirm user roles and permissions.');
bullet('Confirm required student, teacher, attendance, marks, fees, and exam fields.');
bullet('Confirm grading scale and pass/fail rules.');
bullet('Confirm fee terms, categories, scholarship, previous due, and payment process.');
bullet('Confirm notice audiences and expiry rules.');
bullet('Confirm deployment environment and backup strategy.');
bullet('Prepare test data for owner, teacher, and student accounts.');

doc.addPage();
doc.font('Helvetica-Bold').fontSize(28).fillColor(colors.navy).text('End of Research Document', 55, 220, {
  width: doc.page.width - 110,
  align: 'center',
});
doc.moveDown(1);
doc.font('Helvetica').fontSize(11).fillColor(colors.gray).text('This document provides the pre-development research foundation for the Everest View ERP School Management System.', 55, 282, {
  width: doc.page.width - 110,
  align: 'center',
});
doc.moveDown(3);
doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.blue).text('Everest View Secondary Boarding School', 55, 380, {
  width: doc.page.width - 110,
  align: 'center',
});
doc.font('Helvetica').fontSize(9).fillColor(colors.gray).text('ERP School Management System', 55, 398, {
  width: doc.page.width - 110,
  align: 'center',
});

const pageRange = doc.bufferedPageRange();
for (let i = pageRange.start; i < pageRange.start + pageRange.count; i += 1) {
  doc.switchToPage(i);
  pageNumber = i + 1;
  footer();
}

doc.end();
