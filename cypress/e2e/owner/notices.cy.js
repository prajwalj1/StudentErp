describe("Owner Notices Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/notices");
  });

  it("displays notices page", () => {
    cy.contains("Send Notice").should("be.visible");
    cy.contains("Create and send notices to teachers and students").should("be.visible");
  });

  it("shows compose form fields", () => {
    cy.contains("Compose Notice").should("be.visible");
    cy.contains("Attach Image (optional)").should("be.visible");
    cy.contains("Expiry Date (optional)").should("be.visible");
    cy.contains("Send To").should("be.visible");
  });

  it("has audience selector buttons", () => {
    cy.contains("Everyone").should("be.visible");
    cy.contains("Teachers").should("be.visible");
    cy.contains("Students").should("be.visible");
  });

  it("shows recent notices list", () => {
    cy.contains("Recent Notices").should("be.visible");
  });
});
