ace.define("ace/mode/curl_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
    "use strict";
    
    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
  
  
  var CurlHighlightRules = function() {
  
      var keywordMapper = this.createKeywordMapper({
          "variable.language": "this",
          "keyword":
              "curl",
          "constant.language": "post get delete",
          //"support.type": "d x ",
           //   "c n i p f d =  t x string xstring decfloat16 decfloat34",
          "keyword.operator": "abs sign "
      }, "text", true, " ");
  
      this.$rules = {
          "start" : [
          //    {token : "string", regex : "`", next  : "string"},
          //    {token : "string", regex : "'", next  : "qstring"},
          //    {token : "doc.comment", regex : /^\*.+/},
          //    {token : "comment",  regex : /".+$/},
          //    {token : "invalid", regex: "\\.{2,}"},
          //    {token : "keyword.operator", regex: /[=:]/},
          //    {token : "paren.lparen", regex : "[\\[({]"},
          //    {token : "paren.rparen", regex : "[\\])}]"},
          //    {token : "constant.numeric", regex: "[+-]?\\d+\\b"},
          //    {token : "variable.parameter", regex : /sy|pa?\d\d\d\d\|t\d\d\d\.|innnn/},
              {token : "keyword", regex :  /[=|\\]|\-d|\-X/},
          //    {token : "variable.parameter", regex : /\w+-\w[\-\w]*/},
              {token : keywordMapper, regex : "\\b\\w+\\b"},
              {caseInsensitive: true}
          ],
          "qstring" : [
              {token : "constant.language.escape",   regex : "''"},
              {token : "string", regex : "'",     next  : "start"},
              {defaultToken : "string"}
          ],
          "string" : [
              {token : "constant.language.escape",   regex : "``"},
              {token : "string", regex : "`",     next  : "start"},
              {defaultToken : "string"}
          ]
      };
  };
  oop.inherits(CurlHighlightRules, TextHighlightRules);
  
  exports.CurlHighlightRules = CurlHighlightRules;
  });

  ace.define("ace/mode/folding/coffee",["require","exports","module","ace/lib/oop","ace/mode/folding/fold_mode","ace/range"], function(require, exports, module) {
    "use strict";
    
    var oop = require("../../lib/oop");
    var BaseFoldMode = require("./fold_mode").FoldMode;
    var Range = require("../../range").Range;
    
    var FoldMode = exports.FoldMode = function() {};
    oop.inherits(FoldMode, BaseFoldMode);
    
    (function() {
    
        this.getFoldWidgetRange = function(session, foldStyle, row) {
            var range = this.indentationBlock(session, row);
            if (range)
                return range;
    
            var re = /\S/;
            var line = session.getLine(row);
            var startLevel = line.search(re);
            if (startLevel == -1 || line[startLevel] != "#")
                return;
    
            var startColumn = line.length;
            var maxRow = session.getLength();
            var startRow = row;
            var endRow = row;
    
            while (++row < maxRow) {
                line = session.getLine(row);
                var level = line.search(re);
    
                if (level == -1)
                    continue;
    
                if (line[level] != "#")
                    break;
    
                endRow = row;
            }
    
            if (endRow > startRow) {
                var endColumn = session.getLine(endRow).length;
                return new Range(startRow, startColumn, endRow, endColumn);
            }
        };
        this.getFoldWidget = function(session, foldStyle, row) {
            var line = session.getLine(row);
            var indent = line.search(/\S/);
            var next = session.getLine(row + 1);
            var prev = session.getLine(row - 1);
            var prevIndent = prev.search(/\S/);
            var nextIndent = next.search(/\S/);
    
            if (indent == -1) {
                session.foldWidgets[row - 1] = prevIndent!= -1 && prevIndent < nextIndent ? "start" : "";
                return "";
            }
            if (prevIndent == -1) {
                if (indent == nextIndent && line[indent] == "#" && next[indent] == "#") {
                    session.foldWidgets[row - 1] = "";
                    session.foldWidgets[row + 1] = "";
                    return "start";
                }
            } else if (prevIndent == indent && line[indent] == "#" && prev[indent] == "#") {
                if (session.getLine(row - 2).search(/\S/) == -1) {
                    session.foldWidgets[row - 1] = "start";
                    session.foldWidgets[row + 1] = "";
                    return "";
                }
            }
    
            if (prevIndent!= -1 && prevIndent < indent)
                session.foldWidgets[row - 1] = "start";
            else
                session.foldWidgets[row - 1] = "";
    
            if (indent < nextIndent)
                return "start";
            else
                return "";
        };
    
    }).call(FoldMode.prototype);
    
    });

    
    ace.define("ace/mode/curl",["require","exports","module","ace/mode/curl_highlight_rules","ace/mode/folding/coffee","ace/range","ace/mode/text","ace/lib/oop"], function(require, exports, module) {
    "use strict";
    
    var Rules = require("./curl_highlight_rules").CurlHighlightRules;
    var FoldMode = require("./folding/coffee").FoldMode;
    var Range = require("../range").Range;
    var TextMode = require("./text").Mode;
    var oop = require("../lib/oop");
    
    function Mode() {
        this.HighlightRules = Rules;
        this.foldingRules = new FoldMode();
    }
    
    oop.inherits(Mode, TextMode);
    
    (function() {
        
        this.lineCommentStart = '"';
        
        this.getNextLineIndent = function(state, line, tab) {
            var indent = this.$getIndent(line);
            return indent;
        };    
        
        this.$id = "ace/mode/curl";
    }).call(Mode.prototype);
    
    exports.Mode = Mode;
    
    });                (function() {
                        ace.require(["ace/mode/curl"], function(m) {
                            if (typeof module == "object" && typeof exports == "object" && module) {
                                module.exports = m;
                            }
                        });
                    })();
    