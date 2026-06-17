Cypress.on("uncaught:exception", () => false);
describe("Teacher Assignments Page", () => {
  beforeEach(() => {
    cy.loginAsTeacher();
    cy.visit("/teacher/assignments");
  });

  it("displays assignments page", () => {
    cy.contains("Assignments").should("be.visible");
    cy.contains("Create, distribute, and track student coursework and deadlines.").should("be.visible");
  });
});
