Cypress.on("uncaught:exception", () => false);
describe("Teacher Notices Page", () => {
  beforeEach(() => {
    cy.loginAsTeacher();
    cy.visit("/teacher/notices");
  });

  it("displays notices page", () => {
    cy.contains("Notices").should("be.visible");
    cy.contains("View notices from administration").should("be.visible");
  });

  it("shows empty state when no notices", () => {
    cy.contains("No notices yet").should("be.visible");
  });
});
