var fs = require('fs')
var path = require('path')
var sys = require('util')
var process = require('child_process')

exports.execute = function(command)
{
	console.log(command)
	process.execSync(command, exports.puts)
}

exports.puts = function(error, stdout, stderr)
{
	sys.puts(stdout)
}

exports.deleteFolder = function(path)
{
	if (fs.existsSync(path))
	{
		var files = fs.readdirSync(path)
		files.forEach(function(file,index)
		{
			var curPath = path + '/' + file
			if (fs.lstatSync(curPath).isDirectory())
			{
				// recurse
				exports.deleteFolder(curPath)
			}
			else
			{
				// delete file
				console.log('deleting: ' + curPath)
				fs.unlinkSync(curPath)
			}
		})
		fs.rmdirSync(path)
	}
	else
	{
		console.log('Path does not exist: ' + path)
	}
}

exports.fileExists = function(path)
{
	return fs.existsSync(path)
}

exports.readFileUTF8 = function(path)
{
	return fs.readFileSync(path, 'utf8')
}

exports.writeFileUTF8 = function(path, data)
{
	return fs.writeFileSync(path, data, 'utf8')
}

exports.copyFileUTF8 = function(sourePath, destinationPath)
{
	var data = exports.readFileUTF8(sourePath)
	exports.writeFileUTF8(destinationPath, data)
}

exports.cleanUp = function()
{
	console.log('Cleaning files')
	exports.deleteFolder('./platforms')
	exports.deleteFolder('./plugins')
}

exports.getAppVersion = function(cordovaContext)
{
	// Get version from config.xml.
	var tree = getConfigTree(cordovaContext)
	return tree.getroot().attrib.version
}

exports.getAppName = function(cordovaContext)
{
	// Get app name from config.xml.
	var tree = getConfigTree(cordovaContext)
	return tree.findtext('./name');
}

exports.getAppID = function(cordovaContext)
{
	// Get app ID from config.xml.
	var tree = getConfigTree(cordovaContext)
	return tree.getroot().attrib.id
}

exports.getPluginVersions = function(cordovaContext)
{
	// Get plugin versions from plugin.xml files.
	var ET = cordovaContext.requireCordovaModule('elementtree')
	var installedPlugins = exports.getInstalledPlugins()
	if (!installedPlugins)
	{
		return null
	}
	return installedPlugins.map(function(pluginId) {
		var path = 'plugins/' + pluginId + '/plugin.xml'
		var plugin = exports.readFileUTF8(path)
		var tree = ET.parse(plugin)
		var version = tree.getroot().attrib.version
		return { 'id': pluginId, 'version':version }
	})
}

exports.getInstalledPlugins = function()
{
	try
	{
		var plugins = require('../plugins/fetch.json')
		return Object.keys(plugins)
	}
	catch (error)
	{
		return null
	}
}

// This function inserts version info into index.html.
exports.insertVersionInfo = function(cordovaContext, pathToIndexHtml)
{
	if (!exports.fileExists(pathToIndexHtml)) { return }

	// Create HTML with plugin versions.
	var pluginVersions = exports.getPluginVersions(cordovaContext)
	if (!pluginVersions) { return }

	var mapper = function(element) {
		return element.id + ' ' + element.version }
	var pluginVersionsHtml = pluginVersions.map(mapper).join('<br/>\n')

	// Insert version info into index.html.
	var data = exports.readFileUTF8(pathToIndexHtml)
	data = data.replace(/__APP_VERSION__/g, exports.getAppVersion(cordovaContext))
	data = data.replace(/__PLUGIN_VERSIONS__/g, pluginVersionsHtml)
	exports.writeFileUTF8(pathToIndexHtml, data)
}

// Helper function, return the XML tree for config.xml
function getConfigTree(cordovaContext)
{
	// Get version from config.xml.
	var ET = cordovaContext.requireCordovaModule('elementtree')
	var config = exports.readFileUTF8('./config.xml')
	var tree = ET.parse(config)
	return tree
}
