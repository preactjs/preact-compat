let preact = require('preact-compat');

exports.create = function(obj) {
	var children = [];
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			for (var i=0; i<obj[key].length; i++) {
				children.push(preact.cloneElement(obj[key], {
					key: key+'.'+i
				}));
			}
		}
	}
	rturn children;
};
