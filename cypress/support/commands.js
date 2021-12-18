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
Cypress.Commands.add('loginAsUser', () => {
    cy.request({
        method:'POST', 
        url:'/auth/login',
        body: {
          username: "user",
          password: "user_supersecure"
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
