'use strict';
/*
var cv = require('opencv')
var fs = require('fs');
var http = require('http');
var https = require('https');
imageClient = require('google-images');
var nodeImages = require("images")
*/

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
