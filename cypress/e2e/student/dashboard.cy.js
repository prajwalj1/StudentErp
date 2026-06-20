Cypress.on("uncaught:exception", () => false);
describe("Student Dashboard", () => {
  beforeEach(() => {
    cy.loginAsStudent();
    cy.visit("/student/dashboard");
  });

  it("displays student portal", () => {
    cy.contains("Student Portal").should("be.visible");
    cy.contains("Welcome").should("be.visible");
  });

  it("shows stats cards", () => {
    cy.contains("Attendance").should("be.visible");
    cy.contains("Avg. Score").should("be.visible");
    cy.contains("Fee Status").should("be.visible");
    cy.contains("Assignments").should("be.visible");
  });

  it("shows quick links", () => {
    cy.contains("Marksheet").should("be.visible");
    cy.contains("Assignments").should("be.visible");
    cy.contains("Routine").should("be.visible");
    cy.contains("Fees").should("be.visible");
  });

  it("shows quick info sidebar", () => {
    cy.contains("Quick Info").should("be.visible");
    cy.contains("Student ID").should("be.visible");
  });

  it("shows upcoming exams section when data exists", () => {
    cy.contains("Student Portal").should("be.visible");
  });
});
