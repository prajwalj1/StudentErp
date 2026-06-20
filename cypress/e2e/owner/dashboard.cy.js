describe("Owner Dashboard", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/dashboard");
  });

  it("displays welcome hero with school name", () => {
    cy.contains("School Overview").should("be.visible");
    cy.contains("All systems operational").should("be.visible");
  });

  it("shows stat cards", () => {
    cy.contains("Total Students").should("be.visible");
    cy.contains("Total Teachers").should("be.visible");
    cy.contains("Revenue Collected").should("be.visible");
    cy.contains("Avg Attendance").should("be.visible");
  });

  it("shows quick action buttons", () => {
    cy.contains("Add Student").should("be.visible");
    cy.contains("Add Teacher").should("be.visible");
    cy.contains("Collect Fees").should("be.visible");
    cy.contains("Manage Exams").should("be.visible");
  });

  it("shows activity and system health sections", () => {
    cy.contains("Recent Activity").should("be.visible");
    cy.contains("System Health").should("be.visible");
  });

  it("quick action buttons navigate to correct pages", () => {
    cy.contains("Add Student").click();
    cy.url().should("include", "/owner/students");
  });
});
