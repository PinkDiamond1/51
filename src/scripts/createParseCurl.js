//
// createParseCurl(config) --> 
//   function parseCurl(string) --> string
// 
// Given a string like 'curl blah blah' 
//
// it returns either an object like this:
// {
//    input : string // mandatory (the string passed in input)  
//    url: string    // mandatory
//    method: string // mandatory: one of those: post,get,delete,...  
//    data : {k1:v1,k2:v2,...}   // optional but if present at least one pair (never an empty set {})
// }
//  
// or
// 
// {  
//     errorCode: int // the code of the error
//     error: string  // mandatory    error is a message in english which depending on the situation 
//                                    might include the token that caused the problem or the lineNo
// }
//
// All possible errors:                    code      Additional info 
// - expecting CURL Command                   0      none
// - abrupt new line                          1      none
// - Duplicate URL definition                 2      the URLs 
// - unsupported option                       3      the unsupported operation (e.g -s). Note this might be a valid CURL option which sadly our parser does not handle.
// - post/patch without data*                 4      none
// - Invalid Http Method                      5      the method (e.g. -Xpush)
// - Duplicate parameter in -d or --data      6      the duplicate parameter
// - Undefined URL                            7      none
// - URL not allowed                          8      the disallowed url 
// 
// config currently allows you to pass one parameter isValidURL which, if present, is the function which will be used if 
// a URL is a valid URL
//
const createParseCurl = function(config) {
 
  const isValidURL = (config !== undefined && config.isValidURL !== undefined) ? config.isValidURL : function() { return true; }

  //
  // breaks the string into tokens 
  //
  function tokenize(code, ix) {
    const tokens = [];
    for (; true; ix++) {
      while (true) {
        const ch = code.charAt(ix);
        if (ch === " ")  { ix++; continue; }
        if (ch === "\t") { ix++; continue; }
        if (ch === "\\" && code.charAt(ix + 1) === "\n") { ix += 2; continue; }
        break;
      }
      if (ix >= code.length) return tokens;
      let isOpenQuote = false;
      let isOpenDoubleQuote = false;
      let word = [];
      let isAbruptNewLine = false;
      for (; true; ix++) {
        if (ix >= code.length) break;
        const ch = code.charAt(ix);
        if (ch === "\n") break; 
        if (ch === "\r") break; 
        if (ch === " "  && isOpenQuote === false && isOpenDoubleQuote === false) break;
        if (ch === "\t" && isOpenQuote === false && isOpenDoubleQuote === false) break;
        if (ch === "\\" && code.charAt(ix + 1) === "\n" )                                { ix++; break;  } 
        if (ch === "\\" && code.charAt(ix + 1) === "\r" && code.charAt(ix + 2) === "\n") { ix+=2; break;  }  
        if (ch === "\\" && code.charAt(ix + 1) === "\r" )                                { ix++; break;  }  
        if (ch === "'"  && isOpenDoubleQuote === false) { isOpenQuote = !isOpenQuote; continue; }
        if (ch === '"'  && isOpenQuote === false) { isOpenDoubleQuote = !isOpenDoubleQuote; continue; }
        word.push(ch);
      }
      if (word.length > 0) {
        const value = word.join("");
        tokens.push(value);
      }
    }
  };

  return function(s) {
    //
    // [1] skip any initial white space before the word curl
    //
    let ix = 0;
    for (; true; ix++) {
      const ch = s.charAt(ix);
      if (ch === " ") continue;
      if (ch === "\t") continue;
      if (ch === "\n") continue;
      if (ch === "\r") continue;
      break;
    }

    //
    // [2] check we have the word "curl"
    //
    const s2 = s.substring(ix);
    if (s2.startsWith("curl ")) ix += 5;
    else if (s2.startsWith("curl\t")) ix += 5;
    else if (s2.startsWith("curl\\\n")) ix + 6;
    else if (s2 === "curl") ix += 4;
    else {
      return { error : "expecting curl", code : 0 };
    }

    //
    // [3] create the tokens.
    //
    const tokens = tokenize(s, ix);

    const oj = {
      text : s 
    }; 

    //
    // [4] analysis
    //
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      if (token === "-u" || token === "--user") {
        i++;
        if (i < tokens.length) {
          oj.user = tokens[i]; 
        }
      } else if (token.startsWith("-u") || token.startsWith("--user")) {
        const tokenRight = token.startsWith("--user") ? token.substring(5) : token.substring(2);
        oj.user = tokenRight; 
      } else if (token === "-d" || token === "--data") {
        i++;
        if (i < tokens.length) {
          token = tokens[i];
          let ixEqual = token.indexOf("=");
          if (ixEqual !== -1) {
            if (oj.data === undefined) oj.data = {};
            const key =   token.substring(0, ixEqual);
            const value = token.substring(ixEqual + 1);
            if (oj.data[key]) {
              // some logic to prevent user to duplicate definition of the same parameter.
              // e.g -DfirstName=john -DfirstName=Jeff 
              return { error : 'Duplicate parameter in -d or --data' }
            }
            oj.data[key] = value;
          }
        }
      } else if (token.startsWith("-d") || token.startsWith("--data")) {
        const tokenRight = token.startsWith("--data") ? token.substring(5) : token.substring(2);
        let ixEqual = tokenRight.indexOf("=");
        if (ixEqual !== -1) {
          if (oj.data === undefined) oj.data = {};
          const key =   tokenRight.substring(0, ixEqual);
          const value = tokenRight.substring(ixEqual + 1);
          if (oj.data[key]) {
            // some logic to prevent user to duplicate definition of the same parameter.
            // e.g -DfirstName=john -DfirstName=Jeff 
            return { error : 'Duplicate parameter in -d or --data' }
          }
          oj.data[key] = value;
        }
      } else if (token === "-X" || token === "--request") {
        i++;
        if (i < tokens.length) { 
          oj.method = tokens[i].toLowerCase();
        }
      } else if (token.startsWith("-X") || token.startsWith("--request")) {
        const tokenRight = token.startsWith("-X") ? token.substring(2) : token.substring(9);
        oj.method = tokenRight.toLowerCase();
        continue;
      } else if (token.startsWith("-")) {
        return { error : 'Unsupported option '+token }
      } else {
        if (oj.url === undefined) {
          oj.url = token;
        } else {
          return { error : 'Duplicate URL definition ['+oj.url+','+token+']' }
        }
      }
    }
    //
    // [5] sanity checks 
    // 
    if (oj.url === undefined) {
      return { error : 'URL is undefined' };
    }

    if (isValidURL(oj.url)===false) {
      return { error : 'URL not allowed - '+oj.url };
    }

    if (oj.method) {
      if (oj.method !== 'get' &&
          oj.method !== 'head' &&
          oj.method !== 'post' && 
          oj.method !== 'put' &&
          oj.method !== 'delete' &&
          oj.method !== 'connect' &&
          oj.method !== 'options' &&
          oj.method !== 'trace' && 
          oj.method !== 'patch' ) {
        return { error : 'Invalid Http Method' };
      }
    }

    // Defaulting the http method if undefined
    if (oj.method === undefined && oj.data) oj.method = "post";
    if (oj.method === undefined && oj.data === undefined) oj.method = "get";
    return oj;
  } 
}