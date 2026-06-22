import './commands'

before(() => {
  cy.task("warmupRoutes", { timeout: 60000 }).then((result) => {
    cy.log(`Warm-up complete: ${result.total} routes, ${result.failed} non-200`);
  });
});