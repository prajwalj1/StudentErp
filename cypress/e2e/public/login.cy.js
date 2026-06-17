describe("Login Page", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("displays login form", () => {
    cy.contains("Login to ERP").should("be.visible");
    cy.getByPlaceholder("Enter email or ID").should("exist");
    cy.getByPlaceholder("Enter password").should("exist");
    cy.get('button[type="submit"]').contains("Login").should("be.visible");
  });

  it("shows error with invalid credentials", () => {
    cy.intercept("POST", "/api/auth/callback/credentials", {
      statusCode: 401,
      body: { ok: false, error: "CredentialsSignin", url: "http://localhost:3000/login?error=CredentialsSignin" },
    }).as("failedLogin");

    cy.window().then((win) => {
      cy.stub(win, "alert").as("alertStub");
    });
    cy.getByPlaceholder("Enter email or ID").type("wrong@email.com");
    cy.getByPlaceholder("Enter password").type("wrongpass");
    cy.get('button[type="submit"]').click();
    cy.get("@alertStub").should("have.been.calledWith", "Invalid credentials. Please try again.");
  });

  it("displays the school branding on left panel", () => {
    cy.contains("Everest View School ERP").should("be.visible");
    cy.contains("Smart ERP Platform").should("be.visible");
  });

  it("has a note about account creation", () => {
    cy.contains("Only school admin can create teacher & student accounts").should("be.visible");
  });
});
