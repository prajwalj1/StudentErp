describe("Owner Fees Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/fees");
  });

  it("displays fees page with tabs", () => {
    cy.contains("Fees & Payments").should("be.visible");
    cy.contains("Fee Structure").should("be.visible");
    cy.contains("Fee Overview").should("be.visible");
    cy.contains("Payment History").should("be.visible");
  });

  it("fee structure tab shows add button", () => {
    cy.contains("Fee Structure").click();
    cy.contains("Add Fee Structure").should("be.visible");
  });

  it("switches between tabs", () => {
    cy.contains("Fee Overview").click();
    cy.getByPlaceholder("Search students...").should("be.visible");

    cy.contains("Payment History").click();
    cy.contains("Transaction ID").should("be.visible");
    cy.contains("Amount (NPR)").should("be.visible");
  });
});
