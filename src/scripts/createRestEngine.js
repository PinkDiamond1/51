//     
// TO DO: we should have the rest function to get all the instructions.
// something like: getInstructions() 
//
//           
const createRestEngine = function(config) {
  const { bank, parseCurl } = config;

  
  //
  // generatePseudoUID returns a 4 character long string on demand. 
  // Such as "0yj9", "tvip", "msi5", "fphl" ,"8mh1", ...
  // The strings appear to be random, but in reality they are mapped 1-to-1 to an internal counter. 
  // So for example "0yj9" is always the first returned string and "tvip" is always the second string.
  // 
  // You can call this method up to 46K times and you are guaranteed that will be no collision amongst the strings.
  //
  // WATCH OUT: you should invoke generatePseudoUID if you have stored the message.
  //            else you get a nasty defect !!! count needs to be in synch with localStorage.length somehow  
  //            ===================================================================
  // 
  const generatePseudoUID = (function() {
    let count = 0;
    return () => {
      if (count > 46549) throw 'Too many calls'
      const u3 = ((count + 1001) * 42641) % 46549; 
      const n1 = (count*29) % 36; 
      count++;
      return n1.toString(36) + u3.toString(36).padStart(3,'0');
    };
  }());

  
  //
  // System51 controls the way we access the storage system and the system's time. 
  // In particular, it allows us to toggle between the live mode (default) and a timeMachine mode.
  // The timeMachine is on when we are reloading the data.
  //
  const System51 = (function() {

    if (localStorage.getItem("lock") == null) { // done only once
      localStorage.setItem("lock", '0'); 
    }

    async function pause(time) {
      return new Promise((res) => setTimeout(res, time));
    };

    // Writes the message in the localStorage 
    // returns true if it succeeds, false otherwise.
    // 
    // Note: the only reason it would fail to write on the localStorage is because another thread/page is writing at the same time
    // (owns the lock). This implies that this page is not in-synch with the latest.
    // it also implies that since we are listening to "storage" events it will be in-synch shortly. 
    // so, the operation can be re-tried a few milliseconds later it should work
    async function push(message) {
      const id = message; 
      return new Promise(async function(resolve) {
        if (localStorage.getItem('lock') !== '0') { resolve(false); return; }
        localStorage.setItem('lock', id); 
        await pause(100); 
        if (localStorage.getItem('lock') !== id) { resolve(false); return; }
        localStorage.setItem(localStorage.length - 1,message); // We own the lock here, so changes on the localStorage are safe/atomic
        localStorage.setItem('lock', '0'); 
        resolve(true); 
      });
    };

    const fStoreOnLS = async function(text) {
      return push( JSON.stringify({text, timestamp : fGetCurrentISODate() })); 
    };
    const fGetCurrentISODate = function() {
      return new Date().toISOString();
    };
    
    return {
      store : fStoreOnLS,
      getCurrentISODate : fGetCurrentISODate,
      setTimeMachineOn: function(timestamp) {
        System51.store = function() {} 
        System51.getCurrentISODate= function() { return timestamp; }
      },
      setTimeMachineOff: function() {
        System51.store = fStoreOnLS; 
        System51.getCurrentISODate = fGetCurrentISODate; 
      }
    };
  }());
  


//
// UTILITY FUNCTIONS 
// 

  function isISO31661Alpha2(s) {
    const isos = 'AF-AX-AL-DZ-AS-AD-AO-AI-AQ-AG-AR-AM-AW-AU-AT-AZ-BS-BH-BD-BB-BY-BE-BZ-BJ-BM-BT-BO-BA-BW-BV-BR-IO-BN-BG-BF-BI-KH-CM-CA-CV-KY-CF-TD-CL-CN-CX-CC-CO-KM-CG-CD-CK-CR-CI-HR-CU-CY-CZ-DK-DJ-DM-DO-EC-EG-SV-GQ-ER-EE-ET-FK-FO-FJ-FI-FR-GF-PF-TF-GA-GM-GE-DE-GH-GI-GR-GL-GD-GP-GU-GT-GG-GN-GW-GY-HT-HM-VA-HN-HK-HU-IS-IN-ID-IR-IQ-IE-IM-IL-IT-JM-JP-JE-JO-KZ-KE-KI-KR-KP-KW-KG-LA-LV-LB-LS-LR-LY-LI-LT-LU-MO-MK-MG-MW-MY-MV-ML-MT-MH-MQ-MR-MU-YT-MX-FM-MD-MC-MN-ME-MS-MA-MZ-MM-NA-NR-NP-NL-AN-NC-NZ-NI-NE-NG-NU-NF-MP-NO-OM-PK-PW-PS-PA-PG-PY-PE-PH-PN-PL-PT-PR-QA-RE-RO-RU-RW-BL-SH-KN-LC-MF-PM-VC-WS-SM-ST-SA-SN-RS-SC-SL-SG-SK-SI-SB-SO-ZA-GS-ES-LK-SD-SR-SJ-SZ-SE-CH-SY-TW-TJ-TZ-TH-TL-TG-TK-TO-TT-TN-TR-TM-TC-TV-UG-UA-AE-GB-US-UM-UY-UZ-VU-VE-VN-VG-VI-WF-EH-YE-ZM-ZW';
    return (s.length === 2 && isos.indexOf(s.toUpperCase()) % 3 === 0);
  }

  function isEmail(s) {
    const re= /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    return re.test(s);
  }
  
  // Based on https://github.com/google/libaddressinput/wiki/AddressValidationMetadata
  // Returns an address object if successful in parsing the given string 
  // N – Name
  // O – Organisation
  // A – Street Address Line(s)
  // D – Dependent locality (may be an inner-city district or a suburb)
  // C – City or Locality
  // S – Administrative area such as a state, province, island etc
  // Z – Zip or postal code
  // X – Sorting code
  // Returns undefined otherwise. 
  // 
  function parseAddress(s) {
    if (s.startsWith('/GB/')) { //ACZ
      const ix1 = s.indexOf('/',4);     if (ix1 === -1) return; 
      const ix2 = s.indexOf('/',ix1+1); if (ix2 === -1) return; 
      return {
        country : 'GB',
        line : s.substring(4,ix1),
        city : s.substring(ix1+1,ix2),
        zip  : s.substring(ix2+1) 
      }
    }
    if (s.startsWith('/US/')) { //ACSZ
      const areas = {"AL":"Alabama","AK":"Alaska","AS":"American Samoa","AZ":"Arizona","AR":"Arkansas","CA":"California",
                    "CO":"Colorado","CT":"Connecticut","DE":"Delaware","DC":"District Of Columbia","FM":"Federated States Of Micronesia",
                    "FL":"Florida","GA":"Georgia","GU":"Guam","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa",
                    "KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MH":"Marshall Islands","MD":"Maryland",
                    "MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana",
                    "NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York",
                    "NC":"North Carolina","ND":"North Dakota","MP":"Northern Mariana Islands","OH":"Ohio","OK":"Oklahoma",
                    "OR":"Oregon","PW":"Palau","PA":"Pennsylvania","PR":"Puerto Rico","RI":"Rhode Island","SC":"South Carolina",
                    "SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VI":"Virgin Islands",
                    "VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"};

      const ix1 = s.indexOf('/',4);     if (ix1 === -1) return; 
      const ix2 = s.indexOf('/',ix1+1); if (ix2 === -1) return; 
      const ix3 = s.indexOf('/',ix2+1); if (ix3 === -1) return; 
      const line = s.substring(4,ix1);
      const city = s.substring(ix1+1,ix2);
      const area = s.substring(ix2+1,ix3); 
      const zip =  s.substring(ix3+1); 

      if (areas[area] === undefined) return;
      if (/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zip)===false) return; // not a 5 digit zip code
      return {
        country : 'US',
        line,
        city,
        area,
        zip
      }
    }
    // no other countries supported as of now. 
    return undefined;
  }

  function isFirstMiddleOrLastName(s) {
    if (s.length === 0) return false; 
    if (/\d/.test(s))   return false; // false if it contains at least one digit (eg. j0hn)
    return true; 
  }

  // expects yyyy-mm-dd
  // copied from https://stackoverflow.com/questions/18758772/how-do-i-validate-a-date-in-this-format-yyyy-mm-dd-using-jquery
  function isDateOfBirth(dateString) {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if(!dateString.match(regEx)) return false;  // Invalid format
    const d = new Date(dateString);
    const dNum = d.getTime();
    if(!dNum && dNum !== 0) return false; // NaN value, Invalid date
    if(d.getUTCFullYear() < 1900) return false; // date of birth must start from 1900. 
    if(d.getUTCFullYear() > 2006) return false; // date of birth must be before 2006 (an approximation to exclude minors)
    return d.toISOString().slice(0,10) === dateString;
  }

  function isValidStatusForCustomer(s) {
    return s === 'created' || s === 'active' || s === 'inactive';
  }

  // A valid "allDigitNumber" is a number with no decimal (2.0), no exponential representation (10e3), no sign (+20,-30)
  // A valid amount is a string made of only digits (0123456789) starting with a non-zero digit.
  function isOnlyDigitsPositiveNumber(str) {
    if (/^\d+$/.test(str) === false)             return false; // 
    if (str.charAt(0) === 0 && str.length !== 0) return false; // e.g 0832
    const i = +str;
    return (i < 999999999); // must be smaller than some threshold
  }  


//
// REST 
//

  function createHttp503()                                   { return { httpStatusCode : 503, payload : { message : 'localStorage is busy. Please try again later' } } } // <-- to do better message
  function createHttp400(errorCode, message, additionalInfo) { return { httpStatusCode : 400, payload : { errorCode, message, additionalInfo } } }
  function createHttp404(message) {                            return { httpStatusCode : 404, payload : { message } } }
  function createHttp200(payload) {                            return { httpStatusCode : 200, payload } }
  


// The execute method dispatches the call to the 'rest' methods.
// 'rest' methods are like getCustomers, getCustomersId, postCustomers, getAccounts, deleteCustomersId, ...
// 'rest' methods begin with the rest operation they represent (get,post,delete,put,...) 
// 'rest' methods which modify the state (putXXX, postXXX, deleteXXX,) are also given the original input string to persist in the storage
// 'rest' methods which just query the state (getXXX, ...) are not given the input string.

  function getCustomers(){ return createHttp200({objectType:'collection', contents : bank.customers}); }
  function getAccounts() { return createHttp200({objectType:'collection', contents : bank.accounts}); }
  function getPayments() { return createHttp200({objectType:'collection', contents : bank.payments}); }

  function getInstructions() {
    const contents = []; 
    for (let i=0;i<localStorage.length-1; i++) {
      contents.push(JSON.parse(localStorage.getItem(i))); 
    }
    return createHttp200({objectType:'collection', contents });
  }


  function getCustomersId(id) { 
    const customer = bank.customers.find( customer => customer.id === id ); 
    if (customer !== undefined) return createHttp200(customer); 
    return createHttp404('Invalid id for Customer'); 
  }

  function getAccountsId(id) { 
    const account = bank.accounts.find( account => account.id === id ); 
    if (account !== undefined) return createHttp200(account); 
    return createHttp404('Invalid id for Account'); 
  }

  function getPaymentsId(id) {
    const payment = bank.payments.find( payment => payment.id === id ); 
    if (payment !== undefined) return createHttp200(payment); 
    return createHttp404('Invalid id for Payment'); 
  }
  
  async function deleteCustomersId(id, text) { 
    const ix = bank.customers.findIndex( customer => customer.id === id ); 
    if (ix === -1) return createHttp404('Invalid id for Customer'); 
    
    
    const response = await System51.store(text);
    if (response === false) return createHttp503();  

    // IMPORTANT TO DO: business logic I should check if the customer has an account first !!!
    // Customers can only be deleted if their underlying accounts is deleted.
    // Accounts can only be deleted when they have a $0 balance.
    bank.customers.splice(ix, 1);
    return createHttp200({});
  }

  async function deleteAccountsId(id, text) {
    const ix = bank.accounts.findIndex( account => account.id === id ); 
    if (ix === -1) return createHttp404('Invalid id for Account'); 
    
    const response = await System51.store(text);
    if (response === false) return createHttp503();

    // IMPORTANT: see comment above in deleteCustomersId
    bank.accounts.splice(ix, 1); 
    return createHttp200({});
  }

  // the function deletePaymentsId currently does not exist !!!





  async function patchCustomersId(id, data, text) {
    const ix = bank.customers.findIndex( customer => customer.id === id); 
    if (ix === -1) return createHttp404('Invalid id for customer'); 
    if (data === undefined) {
      return createHttp400(0, 'We must have at least a parameter to patch a customer');
    }

    // polish data if required
    if (data.email) data.email = data.email.toLowerCase(); 

    // Extra Fields are not permitted
    for (let i in data) {
      if (i !== 'firstName' && i !== 'middleName' && i !== 'lastName' && i !== 'email' &&     // TO DO NEED TO DECIDE IF WE CAN PATCH EMAIL
          i !== 'nationality' && i !== 'dateOfBirth' && i !== 'address' && i !== 'status') {  // We also allow status here !!!
        return createHttp400(0, 'Invalid parameter in data', i);
      }
    }

    // Validation Rules
    for (let i in data) {
      const value = data[i]; 
      if (i === 'firstName'   && isFirstMiddleOrLastName(value) === false)   return createHttp400(0, 'Invalid Value for parameter', { i : value });
      if (i === 'lastName'    && isFirstMiddleOrLastName(value) === false)   return createHttp400(0, 'Invalid Value for parameter', { i : value });
      if (i === 'middleName'  && isFirstMiddleOrLastName(value) === false)   return createHttp400(0, 'Invalid Value for parameter', { i : value });
      if (i === 'email'       && isEmail(value) === false)                   return createHttp400(0, 'Invalid Value for parameter', { i : value });
      if (i === 'nationality' && isISO31661Alpha2(value) === false)          return createHttp400(0, 'Invalid Value for parameter', { i : value });
      if (i === 'dateOfBirth' && isDateOfBirth(value) === false)             return createHttp400(0, 'Invalid Value for parameter', { i : value });
      if (i === 'address'     && (parseAddress(value) === undefined))        return createHttp400(0, 'Invalid Value for parameter', { i : value });
      if (i === 'status'      && isValidStatusForCustomer(value) === false)  return createHttp400(0, 'Invalid Value for parameter', { i : value });
    }

    // BUSINESS RULES TO BE IMPLEMENTED
    /*
    for (let i in data) {
      if (i === 'firstName') { const rb = businessRule.onPatchCustomerFirstName(customer, data[i]); 
    }
    */
    // for status 
    // we should have some logic like if current is active then it can be patched to created
    // 

    const response = await System51.store(text);
    if (response === false) return createHttp503(); 

    bank.customers[ix] = { ...bank.customers[ix] , ...data, ... { updatedAt : System51.getCurrentISODate() }};
    return createHttp200(bank.customers[ix]);
  }

  async function patchAccountsId(id, data, text) {
    const ix = bank.accounts.findIndex( account => account.id === id); 
    if (ix === -1) return createHttp404('Invalid id for account'); 
    if (data === undefined) {
      return createHttp400(0, 'Missing parameters to patch an account'); 
    }
    for (let i in data) {
      if (i !== 'status' && i !== 'offsetLimit') {
        return createHttp400(0, 'Invalid parameter in data', i);
      }
    }
    
    if (data.offsetLimit !== undefined && isOnlyDigitsPositiveNumber(data.offsetLimit)==false) {
      return createHttp400(0, 'Invalid Parameter', { offsetLimit : data.offsetLimit });
    }

    // business rules are missing.
    // for example we should check that a change in the offsetLimit 
    // does not break any logic in payments
    

    const response = await System51.store(text);
    if (response === false) return createHttp503();


    bank.accounts[ix] = { ...bank.accounts[ix] , ...data, ... { updatedAt : System51.getCurrentISODate()} };
    return createHttp200(bank.accounts[ix]);
  }
  
  async function patchPaymentsId(id , data, text) {
    const ix = bank.payments.findIndex( payment => payment.id === id); 
    if (ix === -1) return createHttp404('Invalid id for payment');     
    if (data === undefined) {
      return createHttp400(0, 'Missing parameters to patch a payment'); // in reality we can only patch 'status' currently.
    }
    for (let i in data) {
      if (i !== 'status') {
        return createHttp400(0, 'Invalid parameter in data', i);
      }
    }

    // business rule 
    if (bank.payments[ix].status !=='created' || data.status !== 'completed') {
      return createHttp400(0,'Invalid Flow for payment status update', { currentStatus : bank.payments[ix].status, proposedStatus : data.status });
    }
     
    const response = await System51.store(text);
    if (response === false) return createHttp503(); 

    bank.payments[ix] = { ...bank.payments[ix] , ...data, ... { updatedAt : System51.getCurrentISODate()} };
    return createHttp200(bank.payments[ix]);
  }

  
  //
  // creates and adds a customer (i.e. a person) to the bank
  // returns either 400 or 200
  //
  async function postCustomers(data, text) {

    if (data === undefined) {
      return createHttp400(0, 'Missing all parameters to create a new customer');
    }

    // polish data if required
    if (data.email) data.email = data.email.toLowerCase(); 

    for (let i in data) {
      if (i !== 'firstName' && i !== 'middleName' && i !== 'lastName' && i !== 'email' && i !== 'nationality' && i !== 'dateOfBirth' && i !== 'address') {
        return createHttp400(0, 'Invalid parameter in data', i);
      }
    }

    if ( data.firstName === undefined)    return createHttp400(0, 'Missing Mandatory parameter', { parameter : 'firstName' }); 
    if ( data.lastName  === undefined)    return createHttp400(0, 'Missing Mandatory parameter', { parameter : 'lastName' }); 
    if ( data.email  === undefined)       return createHttp400(0, 'Missing Mandatory parameter', { parameter : 'email' }); 
    if ( data.nationality  === undefined) return createHttp400(0, 'Missing Mandatory parameter', { parameter : 'nationality' }); 
    if ( data.dateOfBirth === undefined)  return createHttp400(0, 'Missing Mandatory parameter', { parameter : 'dateOfBirth' }); 
    if ( data.address  === undefined)     return createHttp400(0, 'Missing Mandatory parameter', { parameter : 'address' }); 

    if ( isFirstMiddleOrLastName(data.firstName) === false)  return createHttp400(0, 'Invalid Value for parameter', { parameter : 'firstName' }); 
    if ( data.middleName !== undefined && 
         isFirstMiddleOrLastName(data.middleName) === false) return createHttp400(0, 'Invalid Value for parameter', { parameter : 'middleName' }); 
    if ( isFirstMiddleOrLastName(data.lastName) === false)   return createHttp400(0, 'Invalid Value for parameter', { parameter : 'lastName' }); 
    if ( isEmail(data.email) === false)                      return createHttp400(0, 'Invalid Value for parameter', { parameter : 'email' }); 
    if ( isISO31661Alpha2(data.nationality) === false)       return createHttp400(0, 'Invalid Value for parameter', { parameter : 'nationality' }); 
    if ( isDateOfBirth(data.dateOfBirth) === false)          return createHttp400(0, 'Invalid Value for parameter', { parameter : 'dateOfBirth' }); 
    if ( parseAddress(data.address) === undefined)           return createHttp400(0, 'Invalid Value for parameter', { parameter : 'address' }); 

    // business RULE !!!
    const e = bank.customers.find(customer => customer.email === data.email);
    if (e !== undefined) {
      return createHttp400(0, 'email already used by another customer', { email : e.email }); 
    }

    const response = await System51.store(text);
    if (response === false) return createHttp503(); 

    const timestamp = System51.getCurrentISODate();
    const id = 'cu_'+ generatePseudoUID();
    // create the Customer
    const customer = {
      id,
      objectType : 'customer',
      type: 'person',           // In future we might support "business"
      url : 'https://api.51bank.io/customers/'+id,
      status : 'created', 
      createdAt : timestamp, 
      updatedAt : timestamp, 
      firstName : data.firstName,
      middleName : data.middleName,
      lastName : data.lastName,
      email : data.email,
      nationality : data.nationality,
      dateOfBirth : data.dateOfBirth,
      address : parseAddress(data.address)
    };
    bank.customers.push(customer);
    return createHttp200(customer);
  };

  
  async function postAccounts(data, text) {
    if (data === undefined) {
      return createHttp400(0, 'Missing all parameters to create a new account');
    }
  
    const { customerId, type, offsetLimit } = data; 
    if (customerId === undefined)    { return createHttp400(0, 'Missing mandatory parameter ', { key : 'customerId' }); }
    if (type === undefined)          { return createHttp400(0, 'Missing mandatory parameter ', { key : 'type' }); }
    
  
    
    if (bank.customers.find(elem => elem.id == customerId) === undefined) {
      return createHttp400(0, 'Invalid customerId to link to account ', { customerId })
    }

    if (type !== 'personal') { return createHttp400(0, 'parameter type can only be \'personal\''); }

    
    
    if (offsetLimit !== undefined && isOnlyDigitsPositiveNumber(offsetLimit)==false) {
      return createHttp400(0, 'Invalid Parameter', { offsetLimit });
    }
    
    



    // business RULE !!!
    const e = bank.accounts.find(account => account.customerId === customerId);
    if (e !== undefined) {
      return createHttp400(0, 'this customer has already an account ', { customerId }); 
    }

    const response = await System51.store(text);
    if (response === false) return createHttp503(); 
    
    const id = 'ac_'+ generatePseudoUID();
    const timestamp = System51.getCurrentISODate();

    const account = {
      id,
      url : 'https://api.51bank.io/accounts/'+id,
      objectType : 'account',
      type,
      status : 'created' , 
      createdAt : timestamp,
      updatedAt : timestamp, 
      customerId,
      balance: 0,
      currency: "USD",
      offsetLimit : (offsetLimit === undefined) ? 10000 : +offsetLimit
    };

    bank.accounts.push(account);
    return createHttp200(account);
  }


  //
  // creates and adds a payment (i.e. a person) to the bank
  // returns either 400 or 200
  //
  async function postPayments(data, text) {
    if (data === undefined) {
      return createHttp400(0, 'Missing all parameters to create a new payment');
    }

    const { debtorId, creditorId, amount, currency, idempotencyKey } = data; 
    if (debtorId === undefined)       { return createHttp400(0, 'Missing mandatory parameter', { debtorId }); }
    if (creditorId === undefined)     { return createHttp400(0, 'Missing mandatory parameter', { creditorId }); }
    if (amount === undefined)         { return createHttp400(0, 'Missing mandatory parameter', { amount }); }
    if (currency === undefined)       { return createHttp400(0, 'Missing mandatory parameter', { currency }); }
    if (idempotencyKey === undefined) { return createHttp400(0, 'Missing mandatory parameter', { idempotencyKey }); }
    const accountDebtor =    bank.accounts.find(elem => elem.id === debtorId);
    const accountCreditor =  bank.accounts.find(elem => elem.id === creditorId);
    if (accountDebtor   === undefined) { return createHttp400(0, 'Failed to find account for debtorId' ,   { debtorId }); }
    if (accountCreditor === undefined) { return createHttp400(0, 'Failed to find account for creditorId' , { creditorId }); }
    if (debtorId === creditorId)       { return createHttp400(0, 'Same identifier for debtor and creditor', { debtorId, creditorId })}
    
    const idemKeyPayment =  bank.payments.find(elem => elem.idempotencyKey === idempotencyKey);
    if (idemKeyPayment !== undefined) { return createHttp400(0, 'IdempotencyKey previously used', { idempotencyKey }); } // should not give more details.

    if (isOnlyDigitsPositiveNumber(amount) === false)  { return createHttp400(0, 'Invalid amount', {amount} ) }



    if (currency !== accountDebtor.currency)   { 
      return createHttp400(0, 'Invalid Currency for debtor' ,   { currency, accountDebtorCurrency   : accountDebtor.currency }); }
    if (currency !== accountCreditor.currency) { 
      return createHttp400(0, 'Invalid Currency for creditor' , { currency, accountCreditorCurrency : accountCreditor.currency }); }

    const response = await System51.store(text);
    if (response === false) return createHttp503(); 

    const id = 'pa_'+ generatePseudoUID();
    const timestamp = System51.getCurrentISODate();

    const payment = {
      id,
      url : 'https://api.51bank.io/payments/'+id,
      objectType : 'payment',
      type : 'bookTransfer',
      status : 'created',
      createdAt : timestamp,
      updatedAt : timestamp, 
      debtorId, 
      creditorId,
      currency, 
      amount,
      idempotencyKey
    };

    const intAmount = +amount;
    accountDebtor.balance   -= intAmount;
    accountCreditor.balance += intAmount;
    
    bank.payments.push(payment);
    return createHttp200(payment);
  }




  //
  // executeRequest
  // receives a request { method, url, data} 
  // and returns an http-response 
  // Possible results: 
  // 500: (any exception)
  // 400: missing or invalid parameter
  // 400: operation failed (e.g duplicate user, country currently unsupported, operation not supported eg. deletion of account ?)
  // 404: ...
  // 200: ok 
  //
  // Note this method returns null iff the request was an instruction (e.g post,patch, delete) 
  // and the operation failed during the persistance.
  // if the method returns null, the caller is guaranteed that the bank object was not altered by this call.

  const executeRequest = async function (request) {
    const { url, method, data, text } = request;
    if (method ==='get'    && data !== undefined) createHttp400(0, 'data is not allowed for this method', { method, data});
    if (method ==='delete' && data !== undefined) createHttp400(0, 'data is not allowed for this method', { method, data});
    let s = url; 
    if (url.startsWith('https://')) s = url.substring(8);
    if (url.startsWith('http://'))  s = url.substring(7);
    if (url.endsWith('/'))          s = s.substring(0,s.length-1);

    if (s === 'api.51bank.io/instructions' && method === 'get')  return getInstructions();

    if (s === 'api.51bank.io/customers' && method === 'get')  return getCustomers();
    if (s === 'api.51bank.io/customers' && method === 'post') return postCustomers(data, text);
    if (s.startsWith('api.51bank.io/customers/')) {
      const id = s.substring(24); 
      if (method === 'get')    return getCustomersId(id); 
      if (method === 'delete') return deleteCustomersId(id, text); 
      if (method === 'patch')  return patchCustomersId(id, data, text);  
    }

    if (s === 'api.51bank.io/accounts' && method === 'get')  return getAccounts();
    if (s === 'api.51bank.io/accounts' && method === 'post') return postAccounts(data, text);
    if (s.startsWith('api.51bank.io/accounts/')) {
      const id = s.substring(23); 
      if (method === 'get')    return getAccountsId(id); 
      if (method === 'delete') return deleteAccountsId(id, text); 
      if (method === 'patch')  return patchAccountsId(id, data, text); 
    }

    if (s === 'api.51bank.io/payments' && method === 'get')  return getPayments();
    if (s === 'api.51bank.io/payments' && method === 'post') return postPayments(data, text);
    
    if (s.startsWith('api.51bank.io/payments/')) {
      const id = s.substring(23); 
      if (method === 'get')    return getPaymentsId(id); 
      if (method === 'patch')  return patchPaymentsId(id, data, text); 
    }

    return createHttp400(0, 'Unsupported Method, URL pair', {method, url}); 
  }


  
  //
  // Returns an object which lets you load data from the localStorage 
  // by calling its read method as many times as the length. 
  // This operation is expected to be done only once at start up (loading progress bar)
  // 
  // the behaviour of the function 'read' is undefined when invoked more than length-times
  // (and likely to end up with an exception)
  //
  function getLSLoader() {

    async function processTextMessage(message) {
      const { text , timestamp } = JSON.parse(message); 
      const request = parseCurl(text); // guaranteed to return a valid request
      System51.setTimeMachineOn(timestamp); 
      const r = await executeRequest(request);  // guaranteed to return http 200 (but if not I should probably throw a 500 and investigate)
      System51.setTimeMachineOff();
    }

    let count = 0; 
    const length = localStorage.length - 1;
    return {
      length, 
      next : async function() {
        processTextMessage(localStorage.getItem(count)); 
        count++;
        if (count ===  length) { 
          // Once we read the last message we register for 'storage' events. 
          // TO DO: needs a bit of logic to ensure that we don't miss any event during the synch-up phase.
          // 
          window.addEventListener('storage', (event) => {
            if (event.key === 'lock') { return; } // We 'deliberately' ignore updates of others trying to get the lock.
            if (event.key === null) { console.log('wow resetting'); return; } // TO DO: deal better with resetting. (reload page ??? - warning)
            if (event.oldValue != null) { // this is not right, oldValue MUST ALWAYS BE null. System is broke !!!
              console.log('System is broke !!!'); // we should some globalVariable that forces the restengine to return http 5xx from now on.
              throw '';
            }
            processTextMessage(event.newValue); 
            console.log('This page has been notified of a change in storage and synch-ed up ');
          });

          // in the very rare case that during the synch-up new events were generate we process them now.
          // it's very unlikely that we enter this for-loop
          const length2 = localStorage.length - 1; 
          for (; count < length2 ;count++) { 
            console.log('Catching up with an event which occurred while synching up. Event n.'+count);
            processTextMessage(localStorage.getItem(count)); 
          }

          // Final Observation: 
          // we register the eventListener and then we access localStorage.length to verify if we had missed any event.
          // since we don't have any locking there might be a possibility that an event is sent immediately after we register 
          // the event listener, yet before we access the localStorage.length
          // in that case we would process the event twice.
          // since any modifier instruction is idempotent it will not matter !!!
        }
      }
    }
  }



  // TO DO: Should also provide the means to disable the localStorage (isLSEnabled)
  return {
    executeRequest,
    getLSLoader, 
  }
}; 