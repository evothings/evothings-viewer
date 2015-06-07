var UTIL = require('./util.js')

var packageJson = require('../package.json')

function addPlatforms()
{
	packageJson.platforms.forEach(function(platform)
	{
		if (!platformExists(platform))
		{
			UTIL.execute('cordova platform add ' + platform)
		}
	})
}

function platformExists(platform)
{
	return UTIL.fileExists('./platforms/' + platform)
}

exports.addPlatforms = addPlatforms
