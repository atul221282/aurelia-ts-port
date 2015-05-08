System.register([], function(exports_1) {
    var capitalMatcher;
    function addHyphenAndLower(char) {
        return "-" + char.toLowerCase();
    }
    function hyphenate(name) {
        return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
    }
    exports_1("hyphenate", hyphenate);
    return {
        setters:[],
        execute: function() {
            capitalMatcher = /([A-Z])/g;
        }
    }
});
