Cypress.on("uncaught:exception", () => false);
describe("Student Assignments Page", () => {
  beforeEach(() => {
    cy.loginAsStudent();
    cy.visit("/student/assignments");
  });

  it("displays assignments page", () => {
    cy.contains("Assignments").should("be.visible");
    cy.contains("Assignments assigned by your teachers").should("be.visible");
  });

  it("shows list of assignments or empty state", () => {
    cy.contains("No assignments posted yet").should("be.visible");
  });
});
