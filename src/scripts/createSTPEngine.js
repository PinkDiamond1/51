//     
// The Straight-Processing-Engine.
// 
//
//           
const createSTPEngine = function(config) {

  const { bank, parseCurl, restEngine } = config;

  
  // looks at any newly created account
  // ... 
  // 
  async function run() {

    // for example: a customer might go from "created" to "active" after a few seconds. The STE basically simulates any KYC verification process.
    const now = new Date().getTime(); 
    //console.log('stpe engine is running');

    for (const customer of bank.customers) {
      if (customer.status === 'created' && (now - new Date(customer.createdAt).getTime() > 10000) ) {
        const message = 'curl '+customer.url+' -u stp.engine -Xpatch -dstatus=active'; 
        const request = parseCurl(message); // we should assume that this always succeeds ?
                                            // or could a user move it to active between the engine's check and its request ???
        await restEngine.executeRequest(request); // we should assume that this always succeeds .  

      }
    }

    for (const payment of bank.payments) {
      if (payment.status === 'created' && (now - new Date(payment.createdAt).getTime() > 10000) ) {
        const message = 'curl '+payment.url+' -u stp.engine -Xpatch -dstatus=completed'; 
        const request = parseCurl(message);
        await restEngine.executeRequest(request);
      }
    }

    for (const account of bank.accounts) {
      if (account.status === 'created' && (now - new Date(account.createdAt).getTime() > 10000) ) {
        const message = 'curl '+account.url+' -u stp.engine -Xpatch -dstatus=active'; 
        const request = parseCurl(message); // we should assume that this always succeeds ?
                                            // or could a user move it to active between the engine's check and its request ???
        const r = await restEngine.executeRequest(request); // we should assume that this always succeeds .   
                                                      // FOR NOW: IF ANYTHING GOES WRONG 
                                                      // IT WILL TRY LATER !!!
                                                      // IT ASSUMES THAT 
                                                      // - EVENTUALLY IT WILL SUCCEED 
                                                      // - AND IF IT GOES WRONG IT IS JUST BECAUSE TOOK LOCK 
                                                      // - ITS OPERATIONS CAN ALWAYS BE TRIED LATER

      
      }
    }
  }


  // for now let's auto run it and see how it goes.
  // ==============================================
  
  (async function loopy() {
    run();
    setTimeout(loopy, 10000); // THIS PROBABLY NEEDS TO BE REDUCED (to 20 seconds)
  })(); 
  
}
