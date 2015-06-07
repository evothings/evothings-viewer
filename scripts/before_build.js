#!/usr/bin/env node

var PLUGINS = require('./plugins.js')

function main()
{
	console.log('@@@ before_build')

	PLUGINS.addPlugins()

	// TODO: Insert build info in index.html
	// This likely needs to be done in another hook.

	// Links to hook programming:
	// https://www.bram.us/2015/01/04/cordova-build-hook-script-for-displaying-build-version-in-your-app/
	// https://github.com/djett41/generator-ionic/blob/master/templates/hooks/after_prepare/update_platform_config.js
	// http://forum.ionicframework.com/t/how-to-maintain-appname-info-plist-for-ios-development/14650/3

	// We can perhaps do a plugin that patches AndroidManifest.xml and Info.plist?
	// http://stackoverflow.com/questions/22769111/add-entry-to-ios-plist-file-via-cordova-config-xml
}

main()
