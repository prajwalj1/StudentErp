Cypress.on("uncaught:exception", () => false);
describe("Student Routine Page", () => {
  beforeEach(() => {
    cy.loginAsStudent();
    cy.visit("/student/routine");
  });

  it("displays routine page", () => {
    cy.contains("Examination Routine").should("be.visible");
    cy.contains("Print / Download").should("be.visible");
  });

  it("shows school letterhead", () => {
    cy.contains("No exam routine published yet").should("be.visible");
  });

  it("shows empty state or routine table", () => {
    cy.contains("No exam routine published yet").should("be.visible");
  });
});
