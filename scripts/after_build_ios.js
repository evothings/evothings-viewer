#!/usr/bin/env node

var UTIL = require('./util.js')

function main()
{
	console.log('@@@ after_build_ios')

	// Copy files.
	UTIL.copyFileUTF8(
		'./config/native/ios/AppDelegate.m',
		'./platforms/ios/Evothings/Classes/AppDelegate.m')
	UTIL.copyFileUTF8(
		'./config/native/ios/main.m',
		'./platforms/ios/Evothings/main.m')
	// TODO: Remove commented out code.
	// Settings are now made in a config plugin.
	//UTIL.copyFileUTF8(
	//	'./config/native/ios/Evothings-Info.plist',
	//	'./platforms/ios/Evothings/Evothings-Info.plist')
}

main()
