describe("Postcard Worker",()=>{
 for(const theme of ["light","dark"]){
  it(`edits and reopens a synthetic shared postcard in ${theme} mode`,()=>{
   cy.visit("/",{onBeforeLoad(win){
    cy.stub(win.navigator.clipboard,"writeText").resolves().as("copy");
    win.localStorage.setItem("pc:seenTutorial","true");win.localStorage.setItem("pc:seenFlipHint","true");win.localStorage.setItem("pc:theme",theme);
    cy.stub(win.navigator.geolocation,"getCurrentPosition").callsFake(ok=>ok({coords:{latitude:21.3,longitude:-157.8}})).as("location");
   }});
   cy.get('[data-testid="home"]').should("exist");
   cy.get("@location").should("not.have.been.called");
   cy.document().then(doc=>{
    const href=doc.querySelector('link[rel="manifest"]').getAttribute("href");
    expect(href).to.match(/^data:application\/manifest\+json,/);
    const manifest=JSON.parse(decodeURIComponent(href.split(",").slice(1).join(",")));
    expect(manifest.start_url).to.equal(doc.location.origin+"/");
    expect(manifest.icons.every(icon=>new URL(icon.src).origin===doc.location.origin)).to.equal(true);
   });
   cy.get('[aria-label="Click to flip postcard"]').click();
   cy.contains("button","Use my location").click();cy.get("@location").should("have.been.calledOnce");
   cy.get(".leaflet-container").should("be.visible");
   cy.get('[aria-label="Your message"]').clear().type("Fixture postcard from Oahu");
   cy.get('[aria-label="Recipient name"]').clear().type("Test Recipient");
   cy.get('[aria-label="Share link"]').invoke("val").then(link=>{
    expect(link).to.contain("?card=");cy.get('[aria-label="Copy link"]').click();cy.get("@copy").should("have.been.calledWith",link);cy.visit(link);cy.get('[aria-label="Click to flip postcard"]').click();
    cy.contains("Fixture postcard from Oahu").should("exist");
    cy.contains("Test Recipient").should("exist");
   });
  });
 }
});
