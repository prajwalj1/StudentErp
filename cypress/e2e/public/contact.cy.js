describe("Contact Page", () => {
  beforeEach(() => {
    cy.visit("/contact");
  });

  it("displays contact form and info", () => {
    cy.contains("Connect with Us").should("be.visible");
    cy.contains("We're here to").should("be.visible");
    cy.contains("support").should("be.visible");
    cy.contains("Send Message").should("be.visible");
  });

  it("has department selector buttons", () => {
    cy.contains("Admissions").should("be.visible");
    cy.contains("Technical Support").should("be.visible");
    cy.contains("General Inquiry").should("be.visible");
  });

  it("shows contact details", () => {
    cy.contains("support@everestview.edu.np").should("be.visible");
    cy.contains("+977 1-4567890").should("be.visible");
  });

  it("shows success message on form submission", () => {
    cy.intercept("POST", "/api/contact", {
      statusCode: 200,
      body: { message: "Success" },
    }).as("submitContact");

    cy.getByPlaceholder("Your Full Name").type("Test User");
    cy.getByPlaceholder("Work Email Address").type("test@example.com");
    cy.getByPlaceholder("How can we help you today?").type("This is a test message.");

    cy.get("form").first().submit();
    cy.wait("@submitContact");
    cy.contains("Success! We'll be in touch very soon.").should("be.visible");
  });

  it("shows quick stats", () => {
    cy.contains("24/7").should("be.visible");
    cy.contains("Expert Support").should("be.visible");
    cy.contains("< 2hr").should("be.visible");
    cy.contains("Response Time").should("be.visible");
  });
});
