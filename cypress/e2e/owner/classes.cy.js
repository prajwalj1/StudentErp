describe("Owner Classes Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/classes");
  });

  it("displays class schedules page", () => {
    cy.contains("Class Schedules & Assign").should("be.visible");
    cy.contains("Manage academic classes, rooms, time slots, and assigned teachers.").should("be.visible");
  });

  it("shows stat cards", () => {
    cy.contains("Total Classes").should("be.visible");
    cy.contains("Active Grades").should("be.visible");
    cy.contains("Assigned Teachers").should("be.visible");
  });

  it("has search and grade filter", () => {
    cy.getByPlaceholder("Search by subject, teacher name, or room...").should("exist");
    cy.contains("Filter Grade:").should("be.visible");
  });

  it("opens add class schedule modal", () => {
    cy.contains("Add Class Schedule").click();
    cy.contains("Add New Class Schedule").should("be.visible");
    cy.contains("Subject Name").should("be.visible");
    cy.contains("Grade").should("be.visible");
    cy.contains("Section").should("be.visible");
    cy.contains("Schedule Time").should("be.visible");
    cy.contains("Assign Teacher").should("be.visible");
  });
});
