Cypress.on("uncaught:exception", () => false);
describe("Teacher My Classes Page", () => {
  beforeEach(() => {
    cy.loginAsTeacher();
    cy.visit("/teacher/classes");
  });

  it("displays my classes page", () => {
    cy.contains("My Classes").should("be.visible");
    cy.contains("Manage your assigned classes and view student details.").should("be.visible");
  });

  it("shows empty state when no classes assigned", () => {
    cy.contains("You have not been assigned any classes yet.").should("be.visible");
  });
});
