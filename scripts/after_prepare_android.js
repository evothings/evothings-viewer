#!/usr/bin/env node

module.exports = function(context)
{
	console.log('@@@ after_prepare_android')

	var UTIL = require('./util.js')

	// Insert version info into target index.html.
	UTIL.insertVersionInfo(context, './platforms/android/assets/www/index.html')

	// Copy files.
	UTIL.copyFileUTF8(
		'./config/native/android/src/com/evothings/evothingsstudioapp/MainActivity.java',
		'./platforms/android/src/com/evothings/evothingsstudioapp/MainActivity.java')
}
