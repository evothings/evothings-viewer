#!/usr/bin/env node

var UTIL = require('./util.js')

function main()
{
	console.log('@@@ after_build_android')

	// We may need to move this to another hook.

	UTIL.copyFileUTF8(
		'./config/native/android/src/com/evothings/evothingsstudioapp/MainActivity.java',
		'./platforms/android/src/com/evothings/evothingsstudioapp/MainActivity.java')
}

main()
