describe("404 Page", () => {
  it("displays custom 404 page", () => {
    cy.visit("/nonexistent-page", { failOnStatusCode: false });
    cy.contains("404").should("be.visible");
    cy.contains("Lost in the Cloud?").should("be.visible");
    cy.contains("Back to Dashboard").should("have.attr", "href", "/");
    cy.contains("Report an Issue").should("have.attr", "href", "/contact");
  });
});
