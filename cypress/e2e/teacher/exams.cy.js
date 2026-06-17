Cypress.on("uncaught:exception", () => false);
describe("Teacher Exams Page", () => {
  beforeEach(() => {
    cy.loginAsTeacher();
    cy.visit("/teacher/exams");
  });

  it("displays exams page", () => {
    cy.contains("Examinations").should("exist");
    cy.contains("Select a class to view its examination routine.").should("exist");
  });

  it("shows page description", () => {
    cy.contains("Select a class to view its examination routine.").should("exist");
  });
});
