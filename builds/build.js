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
  const originalLength = code.length;
  if      (filename.endsWith('.js'))   { code = (await minify(code)).code; }
  else if (filename.endsWith('.css'))  { code = new CleanCSS().minify(code).styles; }
  else if (filename.endsWith('.html')) { code = (await htmlMinifier.minify(code, { minifyJS : true, minifyCSS : true, collapseWhitespace: true  })) }
  else return; 
  const length = code.length;
  console.log(filename + ' - ' +(length *100 /originalLength).toFixed(2) + '%');
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
    await compress(file);
  }

  console.log('build completed !!!');

})();