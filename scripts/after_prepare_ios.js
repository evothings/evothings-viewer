#!/usr/bin/env node

module.exports = function(context)
{
	console.log('@@@ after_prepare_ios')

	var UTIL = require('./util.js')

	// Insert version info into target index.html.
	UTIL.insertVersionInfo(context, './platforms/ios/www/index.html')

	// Insert version info into target app.js.
	UTIL.insertVersionInfo(context, './platforms/ios/www/js/app.js')

	var name = UTIL.getAppName(context)
	console.log('@@@ name: '+name)

	// Copy files.
	UTIL.copyFileUTF8(
		'./config/native/ios/AppDelegate.m',
		'./platforms/ios/'+name+'/Classes/AppDelegate.m')
	UTIL.copyFileUTF8(
		'./config/native/ios/main.m',
		'./platforms/ios/'+name+'/main.m')
}
