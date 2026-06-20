describe("Owner Teachers Page", () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit("/owner/teachers");
  });

  it("displays teachers list", () => {
    cy.contains("Teachers").should("be.visible");
    cy.contains("teaching staff members").should("be.visible");
  });

  it("has Add Teacher button that opens modal", () => {
    cy.contains("Add Teacher").click();
    cy.contains("Add New Teacher").should("be.visible");
    cy.contains("Full Name").should("be.visible");
    cy.contains("Email").should("be.visible");
    cy.contains("Teacher ID").should("be.visible");
    cy.contains("Password").should("be.visible");
  });

  it("cancels Add Teacher modal", () => {
    cy.contains("Add Teacher").click();
    cy.contains("Add New Teacher").should("be.visible");
    cy.contains("Cancel").click();
    cy.contains("Add New Teacher").should("not.exist");
  });

  it("shows teacher table with correct columns", () => {
    cy.contains("Teacher").should("be.visible");
    cy.contains("Email").should("be.visible");
    cy.contains("Teacher ID").should("be.visible");
    cy.contains("Actions").should("be.visible");
  });
});
