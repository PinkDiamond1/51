
// A monitoring table is an HTML Element <Table> 
// which monitors an array of objects (generally all of the same type) 
// 
// The table refreshes automatically itself. 
// config {
//   array: the array to monitor
//   column: the columns to display 
// }
//
// Note: for sake of simplicity the life cycle has not a start/stop method. 
//       (it will loop indefinitely)
//         
//
function createMonitoringTable(config) {
  // 
  // we expect/support value to be only one of the following:
  // null, undefined, boolean, number, string, string[]
  // 
  function stringify(value) {
    if (value === null)      return '';
    if (value === undefined) return '';
    return ''+value;
  }

  //
  // Gets the value for the object or the value of the value for the object (up to just one level, that is only one dot allowed)
  // getValueFor(oj, 'name')       ==> oj.name ==>       'lorenzo'
  // getValueFor(oj, 'address.no') ==> oj.address.no ==> 25
  //
  function getValueFor(oj, key) {
    const ix = key.indexOf('.');
    if (ix === -1) return stringify(oj[key]);
    const intermediate = oj[key.substring(0,ix)];
    if (intermediate === undefined) return ''; 
    return stringify(intermediate[key.substring(ix+1)]);
  }

  const {array, columns } = config;  
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  thead.innerHTML = columns.map(e => '<th>'+e+'</th>').join('');
  table.appendChild(tbody);

  const trNoData = document.createElement('tr');
  {
    const td = document.createElement('td');
    td.colSpan = columns.length;
    td.innerHTML = '<I>No data</I>';
    trNoData.appendChild(td);
  }
  

  const trids = {} // to do: implement with a map :-) 

  function repaint() {
    for (id in trids) { trids[id] = 0; }

    for (let i=0;i<array.length;i++) {
      const oj = array[i]; 
      const id = 'tr'+oj.id; 
      trids[id] = 1;
      let tr = document.getElementById(id);
      if (tr == null) {  // this is a new row (post)
        tr = document.createElement('tr');
        tr.id = id;
        for (const c of columns) {
          const td = document.createElement('td');
          td.innerHTML = getValueFor(oj,c); 
          tr.appendChild(td); 
        }
        tbody.prepend(tr);
        if (table.parentNode != null) { // the parentNode is null when the table is getting initialized.
          tr.style.background = '#eee';
          setTimeout(() => tr.style.background ='', 800); 
        }
      } else { // this might be a patch. 
        for (let j=0;j<columns.length;j++) {
          const value = getValueFor(oj,columns[j]);
          const td = tr.children[j];
          const tdValue = td.innerHTML; 
          if (value !== tdValue) {
            td.innerHTML = value; 
            td.style.background = '#eee';
            setTimeout(() => td.style.background ='', 800); 
          }
        }
      }
    }

    for (id in trids) {
      if (trids[id] === 0) { // this is an item to delete. 
        let tr = document.getElementById(id);
        delete trids[id];
        tr.style.background = '#eee';
        tr.style.opacity = 0.5; 
        setTimeout(() => tbody.removeChild(tr), 800);
      }
    }

    // logic to decide whether to display the trNoData
    if (tbody.childElementCount === 0 && trNoData.parentNode === null)  { 
        tbody.prepend(trNoData); 
    } else if (trNoData.previousElementSibling) {
        tbody.removeChild(trNoData); 
    }
  }

  function loopy() { 
    repaint(); 
    setTimeout(loopy,1000);
  }
  loopy();
  return table; 
}
