describe("Shared Layout Components", () => {
  it("Header displays on landing pages", () => {
    cy.visit("/");
    cy.get("header").should("exist");
    cy.contains("Home").should("be.visible");
    cy.contains("Features").should("be.visible");
    cy.contains("Contact").should("be.visible");
    cy.contains("Sign In").should("be.visible").and("have.attr", "href", "/login");
  });

  it("Header is hidden on login page", () => {
    cy.visit("/login");
    cy.get("header").should("not.exist");
    cy.contains("Home").should("not.exist");
  });

  it("Footer displays on landing pages", () => {
    cy.visit("/");
    cy.scrollTo("bottom");
    cy.contains("Everest View ERP").should("be.visible");
    cy.contains("For Students").should("be.visible");
    cy.contains("For Teachers").should("be.visible");
    cy.contains("Stay Updated").should("be.visible");
  });

  it("Footer is hidden on login page", () => {
    cy.visit("/login");
    cy.contains("Everest View ERP").should("not.exist");
  });

  it("Footer has social media links", () => {
    cy.visit("/");
    cy.scrollTo("bottom");
    cy.get('a[aria-label="Facebook"]').should("exist");
    cy.get('a[aria-label="TikTok"]').should("exist");
    cy.get('a[aria-label="YouTube"]').should("exist");
  });

  it("Footer has legal links", () => {
    cy.visit("/");
    cy.scrollTo("bottom");
    cy.contains("Privacy Policy").should("have.attr", "href", "/privacy");
    cy.contains("Terms of Service").should("have.attr", "href", "/terms");
    cy.contains("Cookie Policy").should("have.attr", "href", "/cookies");
  });

  it("Footer subscription form exists", () => {
    cy.visit("/");
    cy.scrollTo("bottom");
    cy.getByPlaceholder("Email address").should("exist");
    cy.contains("Subscribe").should("exist");
  });
});
