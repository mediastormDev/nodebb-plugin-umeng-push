module.exports.listcast = function (title, body, pushIds, options = {}) {
	options.Appkey = this.appkey;
	options.os_activity = this.os_activity;
	if (!options.title) options.title = title;
	if (!options.body) options.body = body;
	if (!options.pushIds) options.pushIds = pushIds;
	let template = Template('listcast', options);
	return Push(template, this.appSecret);
}

function Template(type, options) {
	let template = {
		"appkey": options.Appkey,        // 必填，应用唯一标识
		"timestamp": Date.now(),    // 必填，时间戳，10位或者13位均可，时间戳有效期为10分钟
		"type": type, // 必填，消息发送类型
		"payload":{    // 必填，JSON格式，具体消息内容(iOS最大为2012B)
			"aps":{    // 必填，严格按照APNs定义来填写
				"alert": {,    // 当content-available=1时(静默推送)，可选; 否则必填
				    // 可为字典类型和字符串类型
					"title": options.title,
					// "subtitle":"subtitle",
					"body": options.body
				}
				// "badge": xx,    // 可选
				// "sound":"xx",    // 可选
				// "content-available": 0    // 可选，代表静默推送
				// "category":"xx",    // 可选，注意: ios8才支持该字段
			},
		},
	}
	switch (type) {
		case 'unicast': //单播
			template.device_tokens = options.pushId; //表示指定的单个设备
			break;
		case 'listcast':    //列播，要求不超过500个device_token
			template.device_tokens = options.pushIds.join(','); //要求不超过500个, 以英文逗号分隔
			break;
	}
	return template;
}

function Push(template, appSecret) {
	let sign = getSign(template, appSecret);
	return post('https://msgapi.umeng.com/api/send?sign=' + sign, {data: template});
}

function getSign(body, app_master_secret) {
	let method = 'POST';
	let url = 'https://msgapi.umeng.com/api/send';
	let post_body = JSON.stringify(body);
	return md5(method + url + post_body + app_master_secret);
}
