describe("Owner Attendance Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
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
