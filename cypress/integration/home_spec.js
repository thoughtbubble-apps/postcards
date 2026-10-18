for (const theme of ['light', 'dark']) {
  describe(`Postcard in ${theme} mode`, () => {
    it('defers the map and location permission, and shares an editable card', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('pc:theme', theme)
          win.localStorage.setItem('pc:seenTutorial', 'true')
          cy.stub(win.navigator.geolocation, 'getCurrentPosition').as('location')
        },
      })
      cy.get('[data-testid=home]').should('exist')
      cy.get('.leaflet-container').should('not.exist')
      cy.get('@location').should('not.have.been.called')
      cy.get('[aria-label="Click to flip postcard"]').focus().type('{enter}')
      cy.get('.leaflet-container').should('exist')
      cy.get('[aria-label="Your message"]').type('Hello from the Alps')
      cy.get('[aria-label="Recipient name"]').type('Brian')
      cy.contains('button', 'Use my location').click()
      cy.get('@location').should('have.been.calledOnce')
      cy.get('[aria-label="Share link"]').invoke('val').then((url) => {
        cy.visit(url)
        cy.get('[aria-label="Click to flip postcard"]').focus().type(' ')
        cy.get('.message-display').should('have.text', 'Hello from the Alps')
        cy.contains('.address-display', 'To: Brian').should('exist')
        cy.get('.leaflet-container').should('exist')
      })
    })
  })
}
