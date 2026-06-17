describe("Home Page", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("loads successfully", () => {
    cy.contains("Everest View Boarding School").should("be.visible");
    cy.contains("Unity of Nation & Purity of Knowledge").should("be.visible");
  });

  it("has working navigation links", () => {
    cy.contains("Get Started Free").should("have.attr", "href", "/login");
    cy.contains("Learn More").should("exist");
  });

  it("displays all sections", () => {
    cy.contains("Features").should("exist");
    cy.contains("Contact").should("exist");
  });

  it("displays Hero section with student counter", () => {
    cy.contains("Students").should("be.visible");
    cy.contains("Faculty").should("be.visible");
    cy.contains("Awards").should("be.visible");
  });
});
