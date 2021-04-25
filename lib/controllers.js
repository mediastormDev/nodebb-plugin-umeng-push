'use strict';
var groups = require.main.require('./src/groups');
var Controllers = {};

Controllers.renderAdminPage = function (req, res, next) {
	/*
		Make sure the route matches your path to template exactly.

		If your route was:
			myforum.com/some/complex/route/
		your template should be:
			templates/some/complex/route.tpl
		and you would render it like so:
			res.render('some/complex/route');
	*/

	groups.getGroupsFromSet('groups:visible:createtime', req.uid, 0, -1, function (err, groupData) {
		if (err) {
			return next(err);
		}
		res.render('admin/plugins/firebase-notification', {groups: groupData})
	});
};

module.exports = Controllers;
