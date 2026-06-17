describe("Owner Marks Entry", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/marks");
  });

  it("displays marks entry page", () => {
    cy.contains("Marks Entry").should("be.visible");
    cy.contains("Enter and manage student marks").should("be.visible");
  });

  it("shows exam type selector", () => {
    cy.contains("First Term").should("exist");
    cy.contains("Mid Term").should("exist");
    cy.contains("Final Term").should("exist");
  });

  it("shows grade and section filters", () => {
    cy.get('select', { timeout: 15000 }).should('have.length.at.least', 1);
  });
});
