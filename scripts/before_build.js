#!/usr/bin/env node

var PLUGINS = require('./plugins.js')

function main()
{
	console.log('@@@ before_build')

	PLUGINS.addPlugins()

	// TODO: Insert build info in index.html
	// Patch __APP_VERSION__ in index.xml.
	// Does this need to be done in another hook?

	// TODO: Is vibrate permission needed? This setting is missing now.
	// Add vibrate plugin? <uses-permission android:name="android.permission.VIBRATE" />

	// Links to hook programming:
	// https://www.bram.us/2015/01/04/cordova-build-hook-script-for-displaying-build-version-in-your-app/
	// https://github.com/djett41/generator-ionic/blob/master/templates/hooks/after_prepare/update_platform_config.js
	// http://forum.ionicframework.com/t/how-to-maintain-appname-info-plist-for-ios-development/14650/3
	// https://cordova.apache.org/docs/en/5.1.1/plugin_ref_spec.md.html#Plugin%20Specification
}

main()
