//
// nodejs script to build from the /src folder
// the whole website into /docs
//



const fse = require('fs-extra');
const path = require('path');
const { minify } = require("terser");
const  htmlMinifier = require('html-minifier-terser');
const CleanCSS = require('clean-css');


async function compress(filename) {
  let code = fse.readFileSync(filename,{encoding:'utf8', flag:'r'});
  if (filename.endsWith('.js'))   { code = (await minify(code)).code; }
  if (filename.endsWith('.css'))  { code = new CleanCSS().minify(code).styles; }
  if (filename.endsWith('.html')) { code = (await htmlMinifier.minify(code, { minifyJS : true, minifyCSS : true, collapseWhitespace: true  })) }
  fse.writeFileSync(filename, code); 
}


function *walkSync(dir) {
  const files = fse.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}





(async function build() {



  fse.emptyDirSync('./docs'); 
  console.log('removed any file in /docs'); 


  fse.copySync('./src', './docs'); 
  console.log('copied everything from /src to /docs'); 

  console.log('compressing all the resources in docs'); 

  for (const file of walkSync('./docs')) {
    console.log('compressing: '+file);
    compress(file);
  }
  /*
  for (const file of array) {
    console.log('compressing '+file); 
    await compress(file); 
  }
  */
 /*
  await compress('./docs/libs/createBillboard.js');
  await compress('./docs/libs/createMonitoringTable.js');
  await compress('./docs/libs/createParseCurl.js');
  await compress('./docs/libs/createRestEngine.js');
  await compress('./docs/libs/createSTPEngine.js'); 
  await compress('./docs/console.html');
  await compress('./docs/dashboard.html');
  await compress('./docs/docs.html');
  await compress('./docs/docs.banking.operations.html');
  await compress('./docs/docs.get.started.html');
  await compress('./docs/errors.html');
  await compress('./docs/examples.html');
  // await compress('./docs/51.css');
  */
  
  console.log('build completed !!!');

})();