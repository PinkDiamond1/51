//
// nodejs script to build from the /src folder
// the whole website into /docs
//



const fse = require('fs-extra');
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


(async function build() {

  fse.emptyDirSync('./docs'); 
  console.log('removed any file in /docs'); 


  fse.copySync('./src', './docs'); 
  console.log('copied everything from /src to /docs'); 

  console.log('compressing the js files with terser');

  compress('./docs/libs/createBillboard.js');
  compress('./docs/libs/createMonitoringTable.js');
  compress('./docs/libs/createParseCurl.js');
  compress('./docs/libs/createRestEngine.js');
  compress('./docs/libs/createSTPEngine.js'); 
  compress('./docs/console.html');
  compress('./docs/51.css');
  
  
  console.log('build completed !!!');

})();