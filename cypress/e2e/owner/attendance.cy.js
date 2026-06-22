describe("Owner Attendance Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.intercept("GET", "/api/students", [
      { _id: "stu1", name: "Test Student A", grade: "10", section: "A", status: "active" },
      { _id: "stu2", name: "Test Student B", grade: "10", section: "A", status: "active" },
    ]).as("mockStudentsData");
    cy.intercept("GET", "/api/attendance", []).as("mockAttendanceData");
    cy.visit("/owner/attendance");
  });

  it("displays attendance center", () => {
    cy.contains("Attendance Center").should("be.visible");
  });

  it("has view toggle between register and mark attendance", () => {
    cy.contains("Register").should("be.visible");
    cy.contains("button", "Mark").should("be.visible");
  });

  it("shows class selector", () => {
    cy.get("select").first().should("exist");
  });

  it("switches to mark attendance view", () => {
    cy.contains("button", "Mark").click();
    cy.contains("Attendance Center").should("be.visible");
  });
});
