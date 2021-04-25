'use strict';

/* globals $, app, socket, define, config */

define('admin/plugins/firebase-notification', ['settings'], function (settings) {
	var ACP = {};

	ACP.init = function () {
		settings.load('firebase-notification', $('.firebase-notification-settings'));
		$('#save').on('click', saveSettings);
	};

	function saveSettings() {
		settings.save('firebase-notification', $('.firebase-notification-settings'), function () {
			app.alert({
				type: 'success',
				alert_id: 'firebase-notification-saved',
				title: 'Settings Saved',
				message: 'No restart/reload is required',
				timout: 5000
			});
		});
	}

	return ACP;
});
