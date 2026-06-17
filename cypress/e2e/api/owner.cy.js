describe("Owner API Endpoints", () => {
  beforeEach(() => {
    cy.loginAsOwner();
  });

  it("GET /api/teachers returns teacher list", () => {
    cy.request("/api/teachers").then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body).to.be.an("array");
    });
  });

  it("GET /api/students returns student list", () => {
    cy.request("/api/students").then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body).to.be.an("array");
    });
  });

  it("GET /api/classes returns class schedules", () => {
    cy.request("/api/classes").then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body).to.be.an("array");
    });
  });

  it("GET /api/fees returns fee data", () => {
    cy.request("/api/fees").then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body).to.have.property("students");
      expect(r.body).to.have.property("payments");
      expect(r.body).to.have.property("classFees");
    });
  });

  it("GET /api/exams returns exam list", () => {
    cy.request("/api/exams").then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body).to.be.an("array");
    });
  });

  it("GET /api/exam-routines returns routines", () => {
    cy.request("/api/exam-routines").then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body).to.be.an("array");
    });
  });

  it("GET /api/attendance returns attendance records", () => {
    cy.request("/api/attendance").then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body).to.be.an("array");
    });
  });

  it("GET /api/marks returns marks list", () => {
    cy.request("/api/marks").then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body).to.be.an("array");
    });
  });

  it("GET /api/notices returns notices list", () => {
    cy.request("/api/notices").then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body).to.be.an("array");
    });
  });

  it("GET /api/owner/stats returns stats object", () => {
    cy.request("/api/owner/stats").then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body).to.have.property("students");
      expect(r.body).to.have.property("teachers");
      expect(r.body).to.have.property("revenue");
      expect(r.body).to.have.property("attendance");
    });
  });
});
