Cypress.on("uncaught:exception", () => false);

describe("Sidebar Navigation", () => {
  describe("Owner Sidebar", () => {
    beforeEach(() => {
      cy.loginAsOwner();
      cy.visit("/owner/dashboard");
    });

    it("displays all owner navigation links", () => {
      cy.contains("Dashboard").should("exist");
      cy.contains("Students").should("exist");
      cy.contains("Teachers").should("exist");
      cy.contains("Class Schedules").should("exist");
      cy.contains("Attendance").should("exist");
      cy.contains("Marks Entry").should("exist");
      cy.contains("Fees & Payments").should("exist");
      cy.contains("Examinations").should("exist");
      cy.contains("Results").should("exist");
      cy.contains("Reports").should("exist");
      cy.contains("Notices").should("exist");
      cy.contains("Passout Students").should("exist");
    });

    it("highlights active page in sidebar", () => {
      cy.visit("/owner/teachers");
      cy.contains("Teachers").should("have.class", "bg-blue-600");
    });

    it("navigates to teachers page via sidebar", () => {
      cy.contains("Teachers").click();
      cy.url().should("include", "/owner/teachers");
    });

    it("navigates to students page via sidebar", () => {
      cy.contains("Students").click();
      cy.url().should("include", "/owner/students");
    });

    it("displays user info in sidebar", () => {
      cy.contains("Administrator").should("be.visible");
    });

    it("has logout button in sidebar", () => {
      cy.get('button[title="Sign out"]').should("exist");
    });
  });

  describe("Teacher Sidebar", () => {
    beforeEach(() => {
      cy.loginAsTeacher();
      cy.visit("/teacher/dashboard");
    });

    it("displays teacher navigation links", () => {
      cy.contains("Dashboard").should("be.visible");
      cy.contains("My Classes").should("be.visible");
      cy.contains("Attendance").should("be.visible");
      cy.contains("Examinations").should("be.visible");
      cy.contains("Assignments").should("be.visible");
      cy.contains("Marks Entry").should("be.visible");
    });
  });

  describe("Student Sidebar", () => {
    beforeEach(() => {
      cy.loginAsStudent();
      cy.visit("/student/dashboard");
    });

    it("displays student navigation links", () => {
      cy.contains("Dashboard").should("be.visible");
      cy.contains("Marksheet").should("be.visible");
      cy.contains("Assignments").should("be.visible");
      cy.contains("Routine").should("be.visible");
      cy.contains("Fees").should("be.visible");
    });
  });
});
