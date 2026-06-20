describe("Owner Students Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/students");
  });

  it("displays students page with header", () => {
    cy.contains("Students").should("be.visible");
    cy.contains("enrolled students").should("be.visible");
  });

  it("has search and filter controls", () => {
    cy.getByPlaceholder("Search students by name...").should("exist");
    cy.contains("All Grades").should("exist");
  });

  it("has Add Student button that opens modal", () => {
    cy.contains("Add Student").click();
    cy.contains("Add New Student").should("be.visible");
    cy.contains("Full Name").should("be.visible");
    cy.contains("Student ID").should("be.visible");
    cy.contains("Grade").should("be.visible");
  });

  it("has Promote All button", () => {
    cy.contains("Promote All").should("be.visible");
  });
});
