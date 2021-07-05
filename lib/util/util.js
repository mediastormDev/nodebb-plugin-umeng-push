const crypto = require('crypto');

module.exports.md5 = str => {
    str = str.toString();
    let md5 = crypto.createHash('md5');
    return md5.update(str, 'utf8').digest('hex');
}