const https = require('https');
const querystring = require('querystring');

module.exports.get = (url, options = {}) => {
    if (typeof url === 'string') {
        let p = new URL(url);
        options = Object.assign(options, {
            hostname: p.hostname,
            port: p.port,
            path: p.pathname,
            method: p.method,
        });
    } else {
        options = Object.assign(options, url);
    }
    let {hostname, port, path, data} = options;
    return new Promise((resolve, reject) => {
        let params = {
            hostname: hostname,
            port: port || 443,
            path: path,
            method: 'GET',
            headers: options.headers || {}
        };
        if (data) params.path = params.path + '?' + querystring.stringify(data);
        let req = https.request(params, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on("end", () => resolve(data));
        });
        req.on('error', e => reject(e));
        req.end();
    });
};

module.exports.post = (url, options = {}) => {
    if (typeof url === 'string') {
        let p = new URL(url);
        options = Object.assign(options, {
            hostname: p.hostname,
            port: p.port,
            path: p.pathname,
            method: p.method,
            search: p.search,
        });
    } else {
        options = Object.assign(options, url);
    }
    let {hostname, port, path, data, search} = options;
    return new Promise((resolve, reject) => {
        let postData = JSON.stringify(data);
        let params = {
            hostname: hostname,
            port: port || 443,
            path: path,
            method: 'POST',
            headers: options.headers || {}
        };
        if (search) params.path += search;
        params.headers['Content-Type'] = 'application/json; charset=utf-8';
        params.headers['Content-Length'] = Buffer.byteLength(postData);
        let req = https.request(params, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on("end", () => resolve(data));
        });
        req.on('error', e => reject(e));
        req.write(postData);
        req.end();
    });
}