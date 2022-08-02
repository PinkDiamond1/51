/** 
 * creates an HTML element to display a summary of the bank object 
 * 
 * config looks like this
 * { 
 *   bank : object           // The bank object to monitor
 * }   
 * 
 * Note: for sake of simplicity the life cycle has not a start/stop method. 
 *       (it will loop indefinitely)
**/
function createBillboard(config) {
  function createSpanText(txt) { const d = document.createElement('span'); d.innerHTML = txt; return d; }
  const { bank } = config;   
  
  const spanPaymentsCount = createSpanText(bank.payments.length);
  const spanAccountsCount = createSpanText(bank.accounts.length);
  const spanCustomersCount = createSpanText(bank.customers.length); 
  const div = document.createElement('span'); 
  div.appendChild(createSpanText('Payments:'));
  div.appendChild(spanPaymentsCount); 
  div.appendChild(createSpanText(' Accounts:'));
  div.appendChild(spanAccountsCount); 
  div.appendChild(createSpanText(' Customers:'));
  div.appendChild(spanCustomersCount); 
  const loopy = function() {
    spanCustomersCount.style.color = '';
    spanAccountsCount.style.color = '';
    spanPaymentsCount.style.color = '';
    if (bank.payments.length != spanPaymentsCount.innerHTML) {
      spanPaymentsCount.innerHTML = bank.payments.length;
      spanPaymentsCount.style.color = 'orange';
    }
    if (bank.accounts.length != spanAccountsCount.innerHTML) {
      spanAccountsCount.innerHTML = bank.accounts.length; 
      spanAccountsCount.style.color = 'orange';
    }
    if (bank.customers.length != spanCustomersCount.innerHTML) {
      spanCustomersCount.innerHTML = bank.customers.length; 
      spanCustomersCount.style.color = 'orange';
    }
    setTimeout(loopy, 1000); // refresh rate is 1 second. 
  };
  loopy(); 
  return div; 
}