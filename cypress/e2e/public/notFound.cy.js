describe("404 Page", () => {
  it("displays custom 404 page", () => {
    cy.visit("/nonexistent-page", { failOnStatusCode: false });
    cy.contains("404").should("be.visible");
    cy.contains("This page does not exist").should("be.visible");
    cy.contains("Back to Home").should("have.attr", "href", "/");
    cy.contains("Contact Us").should("have.attr", "href", "/#contact");
  });
});
