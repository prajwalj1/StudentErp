describe("Auth API", () => {
  const credentialsUrl = "/api/auth/callback/credentials";

  const getCsrfToken = () =>
    cy.request("/api/auth/csrf").then((res) => res.body.csrfToken);

  it("rejects login with missing credentials", () => {
    getCsrfToken().then((csrfToken) => {
      cy.request({
        method: "POST",
        url: credentialsUrl,
        form: true,
        body: { identifier: "", password: "", csrfToken },
        failOnStatusCode: false,
        followRedirect: false,
      }).then((response) => {
        expect(response.status).to.eq(302);
        expect(response.headers.location).to.include("error=CredentialsSignin");
      });
    });
  });

  it("allows login with owner credentials", () => {
    getCsrfToken().then((csrfToken) => {
      cy.request({
        method: "POST",
        url: credentialsUrl,
        form: true,
        body: { identifier: "owner@erp.com", password: "password", csrfToken },
        failOnStatusCode: false,
        followRedirect: false,
      }).then((response) => {
        expect(response.status).to.eq(302);
        expect(response.headers.location).to.not.include("error");
      });
    });
  });

  it("rejects login with wrong password", () => {
    getCsrfToken().then((csrfToken) => {
      cy.request({
        method: "POST",
        url: credentialsUrl,
        form: true,
        body: { identifier: "owner@erp.com", password: "wrongpass", csrfToken },
        failOnStatusCode: false,
        followRedirect: false,
      }).then((response) => {
        expect(response.status).to.eq(302);
        expect(response.headers.location).to.include("error=CredentialsSignin");
      });
    });
  });
});
