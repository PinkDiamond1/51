hljs.registerLanguage('curl', (function() {
  return {
    case_insensitive : true,
    keywords : {
        $pattern: /curl|-d|-X|\\|=/,
        keyword: 'curl',
        literal: '= \\ -d -X'
    }
  }
}));