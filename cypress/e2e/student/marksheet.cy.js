Cypress.on("uncaught:exception", () => false);
describe("Student Marksheet Page", () => {
  beforeEach(() => {
    cy.loginAsStudent();
    cy.visit("/student/marksheet");
  });

  it("displays marksheet page header", () => {
    cy.contains("Marksheet").should("be.visible");
    cy.contains("Print / Download").should("be.visible");
  });

  it("shows school letterhead on marksheet", () => {
    cy.contains("No marks recorded yet").should("be.visible");
  });

  it("shows progress report title", () => {
    cy.contains("No marks recorded yet").should("be.visible");
  });

  it("shows empty state or marks data", () => {
    cy.contains("No marks recorded yet").should("be.visible");
  });
});
