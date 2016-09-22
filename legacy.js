/* eslint-disable */
var compat = require('.');
var server = require('./server');

for (var i in compat) module.exports[i] = compat[i];
for (var i in server) module.exports[i] = server[i];
