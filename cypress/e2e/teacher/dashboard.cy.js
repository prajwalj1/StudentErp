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
    cy.contains("My Classes").should("be.visible");
  });

  it("shows my students section", () => {
    cy.contains("My Students").should("be.visible");
    cy.contains("View All Students").should("be.visible");
  });

  it("shows class performance section", () => {
    cy.contains("Class Performance").should("be.visible");
    cy.contains("Select a grade to view performance").should("be.visible");
  });
});
