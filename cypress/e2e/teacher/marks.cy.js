Cypress.on("uncaught:exception", () => false);
describe("Teacher Marks Entry", () => {
  beforeEach(() => {
    cy.loginAsTeacher();
    cy.visit("/teacher/marks");
  });

  it("displays marks entry page", () => {
    cy.contains("Marks Entry").should("be.visible");
    cy.contains("Enter and manage student marks").should("be.visible");
  });

  it("has exam type selector", () => {
    cy.contains("First Term").should("exist");
    cy.contains("Mid Term").should("exist");
    cy.contains("Final Term").should("exist");
  });

  it("has grade selector", () => {
    cy.get("select").first().should("exist");
  });
});
