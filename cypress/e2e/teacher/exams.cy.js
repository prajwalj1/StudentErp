Cypress.on("uncaught:exception", () => false);
describe("Teacher Exams Page", () => {
  beforeEach(() => {
    cy.loginAsTeacher();
    cy.visit("/teacher/exams");
  });

  it("displays exams page", () => {
    cy.contains("Examinations").should("exist");
    cy.contains("View exam routines and upload question papers").should("exist");
  });

  it("shows page description", () => {
    cy.contains("View exam routines and upload question papers").should("exist");
  });
});
