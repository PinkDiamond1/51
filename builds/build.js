//
// nodejs script to build from the /src folder
// the whole website into /docs
//
(async function build() {

  const fse = require('fs-extra');
  const { minify } = require("terser");

  fse.emptyDirSync('./docs'); 
  console.log('removed any file in /docs'); 


  fse.copySync('./src', './docs'); 
  console.log('copied everything from /src to /docs'); 

  console.log('compressing the js files with terser');

  code = fse.readFileSync('./docs/libs/createBillboard.js',{encoding:'utf8', flag:'r'});
  code = (await minify(code)).code;
  fse.writeFileSync('./docs/libs/createBillboard.js', code); 
  
  code = fse.readFileSync('./docs/libs/createMonitoringTable.js',{encoding:'utf8', flag:'r'});
  code = (await minify(code)).code;
  fse.writeFileSync('./docs/libs/createMonitoringTable.js', code); 

  code = fse.readFileSync('./docs/libs/createParseCurl.js',{encoding:'utf8', flag:'r'});
  code = (await minify(code)).code;
  fse.writeFileSync('./docs/libs/createParseCurl.js', code); 

  code = fse.readFileSync('./docs/libs/createRestEngine.js',{encoding:'utf8', flag:'r'});
  code = (await minify(code)).code;
  fse.writeFileSync('./docs/libs/createRestEngine.js', code); 

  code = fse.readFileSync('./docs/libs/createSTPEngine.js',{encoding:'utf8', flag:'r'});
  code = (await minify(code)).code;
  fse.writeFileSync('./docs/libs/createSTPEngine.js', code); 



  console.log('build completed !!!');

})();