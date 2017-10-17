

const path = require("path");
const assert = require("assert");

global.onError = null;
function chooseSource(file) {
	file = file || "promise.js";
	
	const Promise = require(path.join(__dirname, '../src', file));
	setExports(module.exports, Promise);
	
	return module.exports;
};
module.exports = chooseSource;

function setExports(exports, Promise) {
    let savedPromise;

	exports.deferred = function __deferred__() {
		const o = {};
		o.promise = new Promise(((resolve,reject) => {
			o.resolve = resolve;
			o.reject = reject;
		}));
		return o;
	};
	
	exports.resolved = function __resolved__(val) {
		return Promise.resolve(val);
	};
	
	exports.rejected = function __rejected__(reason) {
		return Promise.reject(reason);
	};

        exports.defineGlobalPromise = function __defineGlobalPromise__(globalScope) {
	    savedPromise = globalScope.Promise;
	    globalScope.Promise = Promise;

	    global.assert = assert;
	};

        exports.removeGlobalPromise = function __defineGlobalPromise__(globalScope) {
	    delete globalScope.Promise;
	    globalScope.Promise = savedPromise;
	};
}

chooseSource();
