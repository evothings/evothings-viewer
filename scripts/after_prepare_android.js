#!/usr/bin/env node

module.exports = function(context)
{
	console.log('@@@ after_prepare_android')

	var UTIL = require('./util.js')

	// Insert version info into target index.html.
	UTIL.insertVersionInfo(context, './platforms/android/assets/www/index.html')

	// Insert version info into target app.js.
	UTIL.insertVersionInfo(context, './platforms/android/assets/www/js/app.js')

	// Get application ID.
	var appID = UTIL.getAppID(context)

	console.log('@@@ App ID: ' + appID)

	// Read MainActivity.java template file.
	var data = UTIL.readFileUTF8(
		'./config/native/android/src/com/evothings/evothingsviewer/MainActivity.java')

	// Insert package name.
	data = data.replace(/__PACKAGE_NAME__/g, appID)

	// Replace '.' with '/' to get file path to package for class MainActivity.
	// Example: 'com.evothings.evothingsviewer' --> 'com/evothings/evothingsviewer'
	var packagePath = appID.replace(/\./g, '/')

	// Path to where MainActivity.java is to be written.
	var fullDestPath = './platforms/android/src/' + packagePath + '/MainActivity.java'

	// Write MainActivity.java to destination.
	UTIL.writeFileUTF8(fullDestPath, data)
}
