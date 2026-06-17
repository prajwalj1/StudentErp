Cypress.on("uncaught:exception", () => false);
describe("Teacher Dashboard", () => {
  beforeEach(() => {
    cy.loginAsTeacher();
    cy.visit("/teacher/dashboard");
  });

  it("displays welcome banner", () => {
    cy.contains("Welcome Back").should("be.visible");
  });

  it("shows assigned schedule section", () => {
    cy.contains("Assigned Schedule").should("be.visible");
    cy.contains("Classes Total").should("be.visible");
  });

  it("shows my students section", () => {
    cy.contains("My Students").should("be.visible");
    cy.contains("View All Students").should("be.visible");
  });

  it("shows class performance stats", () => {
    cy.contains("Class Performance").should("be.visible");
    cy.contains("Avg. Attendance").should("be.visible");
    cy.contains("Assignment Completion").should("be.visible");
    cy.contains("Exams Prepared").should("be.visible");
  });

  it("shows send notice form", () => {
    cy.contains("Send Notice").should("be.visible");
    cy.getByPlaceholder("Notice title (optional)").should("exist");
    cy.getByPlaceholder("Write your notice...").should("exist");
    cy.contains("Send to Students").should("exist");
  });
});
