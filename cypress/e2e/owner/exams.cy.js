describe("Owner Exams Page", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/exam-routines*", []).as("mockExamRoutines");
    cy.intercept("GET", "/api/exams", []).as("mockExams");
    cy.loginAsOwner();
    cy.visit("/owner/exams");
  });

  it("displays examination form", () => {
    cy.contains("Examination Form").should("be.visible");
    cy.contains("Create and manage exam routines with 3 terms per grade").should("be.visible");
  });

  it("shows grade selector", () => {
    cy.contains("Go").should("be.visible");
  });

  it("can add grade and see term tabs", () => {
    cy.get('[placeholder="Enter grade..."]').type("10");
    cy.contains("Go").click();
    cy.contains("First Term").should("be.visible");
    cy.contains("Second Term").should("be.visible");
    cy.contains("Third Term").should("be.visible");
    cy.contains("Add Subject").should("be.visible");
  });

  it("allows adding a subject", () => {
    cy.get('[placeholder="Enter grade..."]').type("10");
    cy.contains("Go").click();
    cy.contains("Add Subject").click();
    cy.getByPlaceholder("Subject name").should("exist");
  });
});
