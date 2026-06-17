describe("Owner Attendance Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/attendance");
  });

  it("displays attendance center", () => {
    cy.contains("Attendance Center").should("be.visible");
  });

  it("has view toggle between register and mark attendance", () => {
    cy.contains("Attendance Register").should("be.visible");
    cy.contains("Mark Attendance").should("be.visible");
  });

  it("shows class selector", () => {
    cy.get("select").first().should("exist");
  });

  it("switches to mark attendance view", () => {
    cy.contains("Mark Attendance").click();
    cy.contains("Mark All Present").should("be.visible");
    cy.contains("Mark All Absent").should("be.visible");
  });
});
