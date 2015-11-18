var UTIL = require('./util.js')

var packageJson = require('../package.json')

function addPlugins()
{
	packageJson.plugins.forEach(function(plugin)
	{
		if (!pluginExists(plugin))
		{
			// Use plugin location if specified in package.json.
			// This can be a URL or a path on the local file system.
			// If location is not specified the plugin id is used.
			var location = plugin.location || plugin.id
			UTIL.execute('cordova plugin add ' + location)
		}
		if (!pluginExists(plugin))
		{
			console.log("Plugin "+plugin.id+" was not properly added!")
			console.log("Likely cause: our ID does not match remote location's ID.")
			console.log("You should correct the entry in our package.json.")
			throw "PluginAddError"
		}
	})
}

function pluginExists(plugin)
{
	return UTIL.fileExists('./plugins/' + plugin.id)
}

exports.addPlugins = addPlugins
