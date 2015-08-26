'use strict';

var htmlEntities = {
    '&amp;': '&',
    '&gt;': '>',
    '&lt;': '<',
    '&quot;': '"',
    '&#39;': "'"
};

var fn = {
    htmlDecode: function(text) {
        return text.replace(/(&\w\w?\w?\w?\w?;|&#[0-9]{1,5};)/ig, function (match, capture) {
            return (capture in htmlEntities) ? htmlEntities[capture] : capture.substr(1, 1) === "#" ? String.fromCharCode(parseInt(capture.substr(2), 10)) : capture;
        });
    },
    splitSlackParams: function(line) {
        return line.split("+").map(function (arg) { return fn.htmlDecode(arg); });
    }
};

module.exports = fn;
