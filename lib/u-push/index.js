const android = require('./android');
const ios = require('./ios')


class UPush {
    constructor(appkey, appSecret, {ospush, os_activity}) {
        this.appkey = appkey;
        this.appSecret = appSecret;
        this.ospush = ospush;
        this.os_activity = os_activity;
        this.android = {
            unicast: android.unicast.bind(this),
            listcast: android.listcast.bind(this),
            broadcast: android.broadcast.bind(this),
        };
        this.ios = {
            listcast: ios.listcast.bind(this),
        };
    }

}


module.exports = UPush;
