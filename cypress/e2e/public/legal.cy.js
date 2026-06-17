describe("Legal Pages", () => {
  it("displays Terms of Service", () => {
    cy.visit("/terms");
    cy.contains("Terms of Service").should("be.visible");
    cy.contains("Acceptance of Terms").should("be.visible");
    cy.contains("Account Responsibilities").should("be.visible");
  });

  it("displays Privacy Policy", () => {
    cy.visit("/privacy");
    cy.contains("Privacy Policy").should("be.visible");
    cy.contains("Information We Collect").should("be.visible");
    cy.contains("Data Security").should("be.visible");
  });

  it("displays Cookie Policy", () => {
    cy.visit("/cookies");
    cy.contains("Cookie Policy").should("be.visible");
    cy.contains("What Are Cookies").should("be.visible");
    cy.contains("Types of Cookies We Use").should("be.visible");
  });

  it("navigates between legal pages via footer", () => {
    cy.visit("/");
    cy.scrollTo("bottom");
    cy.contains("Privacy Policy").should("be.visible").click();
    cy.url().should("include", "/privacy");
    cy.contains("Privacy Policy").should("be.visible");
  });
});
