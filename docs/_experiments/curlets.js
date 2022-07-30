//
// curlets: curl snippets
//
const curlets = {
  postAlice : 'curl https://api.51bank.io/customers -Xpost \\\n'+
              '-dfirstName=Alice \\\n'+
              '-dlastName=McCartney \\\n'+
              '-demail=alice.mccartney@gmail.com \\\n'+
              '-dnationality=GB \\\n'+
              '-ddateOfBirth="1985-08-23" \\\n'+
              '-daddress="/GB/220 cleveland road/london/w13 9pn"',
  postBob :   'curl https://api.51bank.io/customers -Xpost \\\n'+
              '-d firstName=Bob \\\n'+
              '-d lastName=Burton \\\n'+
              '-d email=bob.burton77@gmail.com \\\n'+
              '-d nationality=GB \\\n'+
              '-d dateOfBirth="1977-02-11" \\\n'+
              '-d address="/GB/44 thames road/london/ec2 4ah"',    
  postAccount : 'curl https://api.51bank.io/accounts -Xpost \\\n'+
                  '-d customerId={uniqueId} \\\n'+
                  '-d description="A little saving account"',
  
  postPayment : 'curl https://api.51bank.io/payments -Xpost \\\n'+
                '-d debtorId={accountId} \\\n'+
                '-d creditorId={accountId} \\\n'+
                '-d amount=1000 \\\n'+
                '-d currency=GBP \\\n'+
                '-d idempotency=d0LUiZ9BeGz7O5RKc5',
  getAllCustomers : 'curl https://api.51bank.io/customers',
  
  
};