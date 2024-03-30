const fs = require('fs');

require.extensions['.browser.js'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

function requireFile(path) {
    return require(path);
}

exports.requireFile = requireFile;
exports.default = requireFile;