describe("Owner Fees Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/fees");
  });

  it("displays fees page with tabs", () => {
    cy.contains("Fees & Payments").should("be.visible");
    cy.contains("Fee Structure").should("be.visible");
    cy.contains("Overview").should("be.visible");
    cy.contains("History").should("be.visible");
  });

  it("fee structure tab shows add button", () => {
    cy.contains("Add Fee Structure").should("be.visible");
  });

  it("switches between tabs", () => {
    cy.contains("Overview").click();
    cy.getByPlaceholder("Search students...").should("be.visible");

    cy.contains("History").click();
    cy.contains("Transaction").should("be.visible");
    cy.contains("Amount").should("be.visible");
  });
});
