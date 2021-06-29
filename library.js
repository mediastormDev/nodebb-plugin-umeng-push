'use strict';

const nconf = require.main.require('nconf');
const url = require('url');
const winston = require.main.require('winston');
const striptags = require('striptags');
const { UPush } = require('node-umeng');
const controllers = require('./lib/controllers');
const topics = require.main.require('./src/topics');
const user = require.main.require('./src/user');
const db = require.main.require('./src/database');
const translator = require.main.require('./src/translator');
const request = require.main.require('request');
const async = require.main.require('async');
const meta = require.main.require('./src/meta');
const { v4: uuidv4 } = require.main.require('uuid');

const appkey = nconf.get('umeng:appKey');
const appSecret = nconf.get('umeng:appSecret');
const uPush = new UPush(appkey, appSecret, { ospush: false, os_activity: null });

const plugin = {};

plugin.init = async (params) => {
	const { router, middleware/* , controllers */ } = params;
	const routeHelpers = require.main.require('./src/routes/helpers');

	/**
	 * We create two routes for every view. One API call, and the actual route itself.
	 * Use the `setupPageRoute` helper and NodeBB will take care of everything for you.
	 *
	 * Other helpers include `setupAdminPageRoute` and `setupAPIRoute`
	 * */
	routeHelpers.setupPageRoute(router, '/umeng-push', middleware, [(req, res, next) => {
		winston.info(`[plugins/umeng-push] In middleware. This argument can be either a single middleware or an array of middlewares`);
		setImmediate(next);
	}], (req, res) => {
		winston.info(`[plugins/umeng-push] Navigated to ${nconf.get('relative_path')}/umeng-push`);
		res.sendStatus(200);	// replace this with res.render('templateName');
	});
	routeHelpers.setupAdminPageRoute(router, '/admin/plugins/umeng-push', middleware, [], controllers.renderAdminPage);
	plugin.reloadSettings();

	// use router not helper to bind token
	router.post('/umeng/token', plugin.checkLoggedIn, plugin.saveToken);
};

plugin.reloadSettings = async () => {
	meta.settings.get('firebase-notification', (err, settings) => {
		if (err) {
			winston.error(`[plugins/umeng-push] Error while loading settings ${err}]`);
			return;
		}
		if (!settings.hasOwnProperty('url') || !settings.url.length) {
			winston.error('[plugins/umeng-push] no url given');
			return;
		}
		plugin.settings = {};
		plugin.settings.url = settings.url;
		plugin.ready = true;
	});
};

plugin.addRoutes = async ({ router, middleware, helpers }) => {
	router.get('/umeng-push/:param1', middleware.authenticate, (req, res) => {
		helpers.formatApiResponse(200, res, {
			foobar: req.params.param1,
		});
	});
};

plugin.addAdminNavigation = function (header, callback) {
	header.plugins.push({
		route: '/plugins/umeng-push',
		icon: 'fa-tint',
		name: '友盟推送设置',
	});

	callback(null, header);
};

plugin.sendNotificationToUMeng = async function (data) {
	var notifObj = data.notification;
	var uids = data.uids;
	console.log(notifObj);

	if (!Array.isArray(uids) || !uids.length || !notifObj) {
		return;
	}

	const [tokens, title] = await Promise.all([
		db.getObjectFields('umeng:tokens', uids),
		notifObj.pid ? topics.getTopicFieldByPid('title', notifObj.pid) : null,
	]);

	async.waterfall([
		function (next) {
			translator.translate(notifObj.bodyShort, function (translated) {
				var notificationBody = translated.replace(/<strong>/g, '').replace(/<\/strong>/g, '');
				next(null, striptags(notificationBody));
			});
		},
		function (text) {
			winston.info(`[plugins/umeng-push] push notification => uid: ${uids} token:${JSON.stringify(tokens)}`);
			uPush.android.unicast(title || text, title ? text : "", uids.map(uid => tokens[uid])).then(res => winston.info(res));
		},
	]);
};

plugin.saveToken = async (req, res) => {
	winston.info(`[plugins/umeng-push] saveToken => uid: ${req.user.uid} token: ${req.body.deviceToken}`);
	await db.setObjectField('umeng:tokens', req.user.uid, req.body.deviceToken);
	res.json({ success: true });
};

plugin.checkLoggedIn = function (req, res, next) {
	if (req.user) {
		if (parseInt(req.user.uid, 10) > 0) next(); else res.redirect('403');
	} else {
		res.redirect('403');
	}
};


module.exports = plugin;
