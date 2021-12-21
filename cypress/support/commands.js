// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
Cypress.Commands.add("register", (name, pass) => {
  cy.request({
    method:'POST', 
    url:'/auth/register',
    body: {
      username: name,
      password: pass
    }
  })
  .as('registerResponse')
  .then((response) => {
    Cypress.env('rtoken', response.body.refreshToken); 
    return response;
  })
  .its('status')
  .should('eq', 200);
})

Cypress.Commands.add('login', (name, pass) => {
    cy.request({
        method:'POST', 
        url:'/auth/login',
        body: {
          username: name,
          password: pass
        }
      })
      .as('loginResponse')
      .then((response) => {
        Cypress.env('rtoken', response.body.refreshToken); 
        return response;
      })
      .its('status')
      .should('eq', 200);
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.request({
      method:'POST', 
      url:'/auth/login',
      body: {
        username: "admin",
        password: "admin_supersecure"
      }
    })
    .as('loginResponse')
    .then((response) => {
      Cypress.env('rtoken', response.body.refreshToken); 
      return response;
    })
    .its('status')
    .should('eq', 200);
})

Cypress.Commands.add('getAT', () => {
  const token = Cypress.env('rtoken');
  cy.request({
      method:'POST', 
      url:'/auth/accessToken',
      body: {
        refreshToken : token
      }
    })
    .as('loginResponse')
    .then((response) => {
      Cypress.env('token', response.body.accessToken);
      return response;
    })
    .its('status')
    .should('eq', 200);
})

Cypress.Commands.add("getAllJobs", () => {
  cy.request({
    method:'GET', 
    url:'/jobs',
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + Cypress.env("token")
    },
  })
  .as('getAllJobResponse')
  .then((response) => {
    Cypress.env("allJobs", response.body);
    return response;
  })
  .its('status')
  .should('eq', 200);
})

Cypress.Commands.add("deleteAllJobs", () => {
  cy.request({
    method:'GET', 
    url:'/jobs',
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + Cypress.env("token")
    },
  })
  .then((response) => {
    response.body.data.forEach(job=> {
      cy.request({
        method:'DELETE', 
        url:'/jobs/'+job.id,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + Cypress.env("token")
        },
      })
      .its('status')
      .should('eq', 200);
    })
    return response;
  })
  .its('status')
  .should('eq', 200);
})

Cypress.Commands.add("addJob", () => {
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
    return response;
  })
  .its('status')
  .should('eq', 200);
})