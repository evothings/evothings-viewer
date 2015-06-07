#!/usr/bin/env node

var UTIL = require('./util.js')
var PLATFORMS = require('./platforms.js')

function main()
{
	UTIL.cleanUp()
	PLATFORMS.addPlatforms()
}

main()
