Cypress.on("uncaught:exception", () => false);
describe("Teacher Students Page", () => {
  beforeEach(() => {
    cy.loginAsTeacher();
    cy.visit("/teacher/students");
  });

  it("displays students page", () => {
    cy.contains("Students").should("be.visible");
    cy.contains("All Grades").should("be.visible");
  });
});
