describe("Owner Reports Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/reports");
  });

  it("displays reports page", () => {
    cy.contains("School Reports").should("be.visible");
    cy.contains("Analytics and overview of school performance").should("be.visible");
  });

  it("shows financial overview", () => {
    cy.contains("Financial Overview").should("be.visible");
    cy.contains("Total Revenue Collected").should("be.visible");
  });

  it("shows academic section", () => {
    cy.contains("Academic & Attendance").should("be.visible");
    cy.contains("Total Students").should("be.visible");
    cy.contains("Total Teachers").should("be.visible");
    cy.contains("Average School Attendance").should("be.visible");
  });

  it("has stat cards", () => {
    cy.contains("Total Students").should("be.visible");
    cy.contains("Total Teachers").should("be.visible");
  });
});
