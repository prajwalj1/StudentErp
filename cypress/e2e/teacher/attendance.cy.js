Cypress.on("uncaught:exception", () => false);
describe("Teacher Attendance Page", () => {
  beforeEach(() => {
    cy.loginAsTeacher();
    cy.visit("/teacher/attendance");
  });

  it("displays attendance page", () => {
    cy.contains("Attendance").should("exist");
    cy.contains("No classes assigned").should("exist");
  });

  it("has class selector", () => {
    cy.get("select").should("exist");
  });
});
