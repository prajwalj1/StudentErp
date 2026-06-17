describe("Owner Passout Students Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/passout");
  });

  it("displays passout students page", () => {
    cy.contains("Students who have graduated and passed out.", { timeout: 15000 }).should("be.visible");
    cy.contains("Passout Students").should("exist");
  });
});
