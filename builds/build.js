//
// nodejs script to build from the /src folder
// the whole website into /docs
//

const fse = require('fs-extra');

const src =  './src';
const docs = './docs';


fse.emptyDirSync(docs); 
console.log('removed any file in /docs'); 


fse.copySync(src, docs); 
console.log('copied everything from /src to /docs'); 


console.log('build completed !!!');