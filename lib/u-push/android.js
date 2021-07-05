let {md5} = require('../util/util');
let {post} = require('../util/https');

module.exports.unicast = function (title, body, pushId, options = {}) {
    options.Appkey = this.appkey;
    options.ospush = this.ospush;
    options.os_activity = this.os_activity;
    if (!options.title) options.title = title;
    if (!options.body) options.body = body;
    if (!options.pushId) options.pushId = pushId;
    let template = Template('unicast', options);
    return Push(template, this.appSecret);
}

module.exports.listcast = function (title, body, pushIds, options = {}) {
    options.Appkey = this.appkey;
    options.ospush = this.ospush;
    options.os_activity = this.os_activity;
    if (!options.title) options.title = title;
    if (!options.body) options.body = body;
    if (!options.pushIds) options.pushIds = pushIds;
    let template = Template('listcast', options);
    return Push(template, this.appSecret);
}

module.exports.broadcast = function (title, body, options = {}) {
    options.Appkey = this.appkey;
    options.ospush = this.ospush;
    options.os_activity = this.os_activity;
    if (!options.title) options.title = title;
    if (!options.body) options.body = body;
    let template = Template('broadcast', options);
    return Push(template, this.appSecret);
}

function Push(template, appSecret) {
    let sign = getSign(template, appSecret);
    return post('https://msgapi.umeng.com/api/send?sign=' + sign, {data: template});
}

function Template(type, options) {
    let template = {
        "appkey": options.Appkey,        // 必填，应用唯一标识
        "timestamp": Date.now(),    // 必填，时间戳，10位或者13位均可，时间戳有效期为10分钟
        "type": type,        // 必填，消息发送类型,其值可以为:
        "payload": {    // 必填，JSON格式，具体消息内容(Android最大为1840B)
            "display_type": options.display_type || 'notification',    // 必填，消息类型: notification(通知)、message(消息)
            "body": {    // 必填，消息体。
                // 当display_type=message时，body的内容只需填写custom字段。
                // 当display_type=notification时，body包含如下参数:
                // 通知展现内容:
                "ticker": options.title,    // 必填，通知栏提示文字
                "title": options.title,    // 必填，通知标题
                "text": options.body,    // 必填，通知文字描述

                // 自定义通知图标:
                // 如果没有，默认使用应用图标。
                // 图片要求为24*24dp的图标，或24*24px放在drawable-mdpi下。
                // 注意四周各留1个dp的空白像素
                "icon": options.icon || '',    // 可选，状态栏图标ID，R.drawable.[smallIcon]，

                // 图片要求为64*64dp的图标，
                // 可设计一张64*64px放在drawable-mdpi下，
                // 注意图片四周留空，不至于显示太拥挤
                "largeIcon": options.largeIcon || '',    // 可选，通知栏拉开后左侧图标ID，R.drawable.[largeIcon]，

                "img": options.img || '',    // 可选，通知栏大图标的URL链接。该字段的优先级大于largeIcon。
                // 该字段要求以http或者https开头。

                // 自定义通知声音:

                // 如果该字段为空，采用SDK默认的声音，即res/raw/下的
                // umeng_push_notification_default_sound声音文件。如果
                // SDK默认声音文件不存在，则使用系统默认Notification提示音。
                "sound": options.sound || '',    // 可选，通知声音，R.raw.[sound]。
            },
        },
        "description": "",    // 可选，发送消息描述，建议填写。
    };
    if (options.ospush) template.ospush = true;
    if (options.os_activity) template.mi_activity = options.os_activity;
    switch (type) {
        case 'unicast': //单播
            template.device_tokens = options.pushId; //表示指定的单个设备
            break;
        case 'listcast':    //列播，要求不超过500个device_token
            template.device_tokens = options.pushIds.join(','); //要求不超过500个, 以英文逗号分隔
            break;
        case 'filecast':    //文件播，多个device_token可通过文件形式批量发送
            break;
        case 'broadcast':   //广播
            break;
        case 'groupcast':   //组播，按照filter筛选用户群, 请参照filter参数
            break;
        case 'customizedcast':  //通过alias进行推送，包括以下两种case: alias: 对单个或者多个alias进行推送 file_id: 将alias存放到文件后，根据file_id来推送
            break;
        default:
            break;
    }
    return template;
}


function getSign(body, app_master_secret) {
    let method = 'POST';
    let url = 'https://msgapi.umeng.com/api/send';
    let post_body = JSON.stringify(body);
    return md5(method + url + post_body + app_master_secret);
}

