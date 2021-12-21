describe('JOBSERVICE tests', () => {

    beforeEach(()=> {
        var user = "u" + Date.now();
        var pass = "p" + Date.now();
        cy.register(user, pass);
        cy.login(user, pass);
        cy.getAT();
    })

    it("should return empty list of jobs", ()=> {
        cy.request({
            method:'GET', 
            url:'/jobs',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + Cypress.env("token")
            },
          })
          .as('loginResponse')
          .then((response) => {
            expect(response.body.data.length).to.eq(0);
          })
          .its('status')
          .should('eq', 200);
    });

    it("should successfully add job into the tables", ()=> {
        cy.request({
            method:'POST', 
            url:'/jobs',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + Cypress.env("token")
            },
            body: {
                "model": 9,
                "dataset": 10,
                "solvers": [{
                    "flagA": false,
                    "flagF": false,
                    "cpuLimit": 1,
                    "memoryLimit": 0,
                    "timeLimit": 0,
                    "solverID": 0
                }]
            }
          })
          .then((response) => {
            expect(response.body.error).to.eq(false);
            cy.request({
                method:'GET', 
                url:'/jobs',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + Cypress.env("token")
                }
              })
              .then((res) => {
                expect(res.body.data.length).to.eq(1);
                expect(res.body.error).to.eq(false);
              })
          })
          .its('status')
          .should('eq', 200);
    });

    it("should delete all jobs", () => {
        cy.getAllJobs();
        cy.deleteAllJobs();

        cy.request({
            method:'GET', 
            url:'/jobs',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + Cypress.env("token")
            }
          })
          .then((response) => {
            expect(response.body.data.length).to.eq(0);
            expect(response.body.error).to.eq(false);
          })
          .its('status')
          .should('eq', 200);
    })
});
