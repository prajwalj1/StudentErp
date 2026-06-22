const mockSession = (role, extra) => ({
  user: {
    id: extra?.id || `${role.toLowerCase()}-1`,
    name: extra?.name || (role === "OWNER" ? "Owner" : role === "TEACHER" ? "Test Teacher" : "Test Student"),
    email: extra?.email || (role === "OWNER" ? "owner@erp.com" : role === "TEACHER" ? "teacher@school.com" : "student@school.com"),
    role,
    ...extra,
  },
  expires: "2099-12-31T23:59:59.999Z",
});

Cypress.Commands.add("loginAsOwner", () => {
  cy.intercept("GET", "/api/auth/session", {
    statusCode: 200,
    body: mockSession("OWNER"),
  }).as("mockOwnerSession");

  cy.intercept("GET", "/api/teachers", []).as("mockTeachers");
  cy.intercept("GET", "/api/students", []).as("mockStudents");
  cy.intercept("GET", "/api/classes", []).as("mockClasses");
  cy.intercept("GET", "/api/fees", { students: [], payments: [], classFees: [] }).as("mockFees");
  cy.intercept("GET", "/api/exams", []).as("mockExams");
  cy.intercept("GET", "/api/exam-routines", []).as("mockExamRoutines");
  cy.intercept("GET", "/api/attendance", []).as("mockAttendance");
  cy.intercept("GET", "/api/marks", []).as("mockMarks");
  cy.intercept("GET", "/api/notices", []).as("mockNotices");
  cy.intercept("GET", "/api/owner/stats", {
    students: 0, teachers: 0, revenue: 0, attendance: 0,
    totalFee: 0, totalPaid: 0, totalDue: 0, gradeDistribution: [],
    recentStudents: [], recentPayments: [], recentTeachers: [],
  }).as("mockOwnerStats");
  cy.intercept("GET", "/api/system-health", { status: "healthy" }).as("mockHealth");
  cy.intercept("GET", "/api/notifications", []).as("mockNotifications");

  cy.session("owner", () => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.task("createSessionToken", { role: "OWNER", name: "Owner", email: "owner@erp.com" }).then((token) => {
      cy.setCookie("next-auth.session-token", token);
    });
    cy.visit("/owner/dashboard");
    cy.url({ timeout: 10000 }).should("include", "/owner/dashboard");
  });
});

Cypress.Commands.add("loginAsTeacher", (email = "teacher@school.com") => {
  cy.intercept("GET", "/api/auth/session", {
    statusCode: 200,
    body: mockSession("TEACHER", { teacherId: "TCH001" }),
  }).as("mockSession");

  cy.intercept("GET", "/api/classes", []).as("mockClasses");
  cy.intercept("GET", "/api/students", []).as("mockStudents");
  cy.intercept("GET", "/api/assignments", []).as("mockAssignments");
  cy.intercept("GET", "/api/attendance", []).as("mockAttendance");
  cy.intercept("GET", "/api/exams", []).as("mockExams");
  cy.intercept("GET", "/api/marks", []).as("mockMarks");
  cy.intercept("GET", "/api/notices", []).as("mockNotices");
  cy.intercept("GET", "/api/lessonplans", []).as("mockLessonplans");

  cy.session(`teacher-${email}`, () => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.task("createSessionToken", { role: "TEACHER", name: "Test Teacher", email, extra: { teacherId: "TCH001" } }).then((token) => {
      cy.setCookie("next-auth.session-token", token);
    });
    cy.visit("/teacher/dashboard");
    cy.url({ timeout: 10000 }).should("include", "/teacher/dashboard");
  });
});

Cypress.Commands.add("loginAsStudent", (id = "STU001") => {
  cy.intercept("GET", "/api/auth/session", {
    statusCode: 200,
    body: mockSession("STUDENT", { studentId: id, grade: "10" }),
  }).as("mockSession");

  cy.intercept("GET", "/api/attendance", []).as("mockAttendance");
  cy.intercept("GET", "/api/marks", []).as("mockMarks");
  cy.intercept("GET", "/api/assignments", []).as("mockAssignments");
  cy.intercept("GET", "/api/fees", { students: [], payments: [], classFees: [] }).as("mockFees");
  cy.intercept("GET", "/api/exam-routines", []).as("mockExamRoutines");
  cy.intercept("GET", "/api/notices", []).as("mockNotices");

  cy.session(`student-${id}`, () => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.task("createSessionToken", { role: "STUDENT", name: "Test Student", email: "student@school.com", extra: { studentId: id, grade: "10" } }).then((token) => {
      cy.setCookie("next-auth.session-token", token);
    });
    cy.visit("/student/dashboard");
    cy.url({ timeout: 10000 }).should("include", "/student/dashboard");
  });
});

Cypress.Commands.add("getByPlaceholder", (text) => {
  return cy.get(`[placeholder="${text}"]`);
});
