#!/usr/bin/env node

module.exports = function(context)
{
	console.log('@@@ before_build')

	var PLUGINS = require('./plugins.js')

	PLUGINS.addPlugins()

	// TODO: Is vibrate permission needed? This setting is missing now.
	// Add some vibrate plugin? <uses-permission android:name="android.permission.VIBRATE" />
}
