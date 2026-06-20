describe("Owner Classes Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/classes");
  });

  it("displays class schedules page", () => {
    cy.contains("Class Schedules").should("be.visible");
    cy.contains("classes across").should("be.visible");
  });

  it("shows stat cards", () => {
    cy.contains("Total Classes").should("be.visible");
    cy.contains("Active Grades").should("be.visible");
    cy.contains("Assigned Teachers").should("be.visible");
  });

  it("has search and grade filter", () => {
    cy.getByPlaceholder("Search by subject, teacher, or room...").should("exist");
  });

  it("opens add class schedule modal", () => {
    cy.contains("Add Class").click();
    cy.contains("Add Class Schedule").should("be.visible");
    cy.contains("Subject").should("be.visible");
    cy.contains("Grade").should("be.visible");
    cy.contains("Section").should("be.visible");
    cy.contains("Time Slot").should("be.visible");
    cy.contains("Assign Teacher").should("be.visible");
  });
});
