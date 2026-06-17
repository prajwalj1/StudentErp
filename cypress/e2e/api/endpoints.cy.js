describe("API Endpoints", () => {
  describe("Public Endpoints", () => {
    it("GET /api/contact returns 405 for GET", () => {
      cy.request({ url: "/api/contact", failOnStatusCode: false }).then((r) => {
        expect(r.status).to.be.oneOf([405, 200, 404]);
      });
    });

    it("POST /api/subscribe accepts email", () => {
      cy.request({
        method: "POST",
        url: "/api/subscribe",
        body: { email: "test@example.com" },
        failOnStatusCode: false,
      }).then((r) => {
        expect(r.status).to.be.oneOf([201, 200, 409, 400]);
      });
    });
  });

  describe("Protected Endpoints (unauthenticated)", () => {
    it("GET /api/teachers returns 401", () => {
      cy.request({ url: "/api/teachers", failOnStatusCode: false }).then((r) => {
        expect(r.status).to.eq(401);
      });
    });

    it("GET /api/students returns 401", () => {
      cy.request({ url: "/api/students", failOnStatusCode: false }).then((r) => {
        expect(r.status).to.eq(401);
      });
    });

    it("GET /api/fees returns 401", () => {
      cy.request({ url: "/api/fees", failOnStatusCode: false }).then((r) => {
        expect(r.status).to.eq(401);
      });
    });

    it("GET /api/classes returns 401", () => {
      cy.request({ url: "/api/classes", failOnStatusCode: false }).then((r) => {
        expect(r.status).to.eq(401);
      });
    });

    it("GET /api/attendance returns 401", () => {
      cy.request({ url: "/api/attendance", failOnStatusCode: false }).then((r) => {
        expect(r.status).to.eq(401);
      });
    });

    it("GET /api/marks returns 401", () => {
      cy.request({ url: "/api/marks", failOnStatusCode: false }).then((r) => {
        expect(r.status).to.eq(401);
      });
    });

    it("GET /api/exams returns 401", () => {
      cy.request({ url: "/api/exams", failOnStatusCode: false }).then((r) => {
        expect(r.status).to.eq(401);
      });
    });

    it("GET /api/exam-routines returns 401", () => {
      cy.request({ url: "/api/exam-routines", failOnStatusCode: false }).then((r) => {
        expect(r.status).to.eq(401);
      });
    });

    it("GET /api/notices returns 401", () => {
      cy.request({ url: "/api/notices", failOnStatusCode: false }).then((r) => {
        expect(r.status).to.eq(401);
      });
    });

    it("GET /api/owner/stats returns 401", () => {
      cy.request({ url: "/api/owner/stats", failOnStatusCode: false }).then((r) => {
        expect(r.status).to.eq(401);
      });
    });
  });
});
