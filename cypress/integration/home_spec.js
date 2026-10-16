describe("Postcard Worker",()=>{
 for(const theme of ["light","dark"]){
  it(`edits and reopens a synthetic shared postcard in ${theme} mode`,()=>{
   cy.visit("/",{onBeforeLoad(win){
    win.localStorage.setItem("pc:seenTutorial","true");win.localStorage.setItem("pc:seenFlipHint","true");win.localStorage.setItem("pc:theme",theme);
    cy.stub(win.navigator.geolocation,"getCurrentPosition").callsFake(ok=>ok({coords:{latitude:21.3,longitude:-157.8}}));
   }});
   cy.get('[data-testid="home"]').should("exist");
   cy.get('[aria-label="Click to flip postcard"]').click();
   cy.get('[aria-label="Your message"]').clear().type("Fixture postcard from Oahu");
   cy.get('[aria-label="Recipient name"]').clear().type("Test Recipient");
   cy.get('[aria-label="Share link"]').invoke("val").then(link=>{
    expect(link).to.contain("?card=");cy.visit(link);cy.get('[aria-label="Click to flip postcard"]').click();
    cy.contains("Fixture postcard from Oahu").should("exist");
    cy.contains("Test Recipient").should("exist");
   });
  });
 }
});
