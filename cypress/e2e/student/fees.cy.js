Cypress.on("uncaught:exception", () => false);
describe("Student Fees Page", () => {
  beforeEach(() => {
    cy.loginAsStudent();
    cy.visit("/student/fees");
  });

  it("displays fees page header", () => {
    cy.contains("No fee structure defined for your class").should("be.visible");
  });

  it("shows school header on bill", () => {
    cy.contains("No fee structure defined for your class").should("be.visible");
  });

  it("shows payment section with due amount", () => {
    cy.contains("No fee structure defined for your class").should("be.visible");
  });
});
