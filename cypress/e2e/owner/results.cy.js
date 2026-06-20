describe("Owner Results Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/results");
  });

  it("displays results page", () => {
    cy.contains("Student Results & Marksheets").should("be.visible");
    cy.contains("Review GPA, percentages, and print official marksheets").should("be.visible");
  });

  it("has exam type and grade selectors", () => {
    cy.contains("First Term").should("exist");
    cy.contains("Mid Term").should("exist");
    cy.contains("Final Term").should("exist");
    cy.contains("All Grades & Sections").should("be.visible");
  });

  it("has print button", () => {
    cy.contains("Print").should("be.visible");
  });
});
