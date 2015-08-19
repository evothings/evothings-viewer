var fs = require('fs')
var path = require('path')
var sys = require('sys')
var process = require('child_process')

function execute(command)
{
	console.log(command)
	process.execSync(command, puts)
}

function puts(error, stdout, stderr)
{
	sys.puts(stdout)
}

function deleteFolder(path)
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
				deleteFolder(curPath)
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

function fileExists(path)
{
	return fs.existsSync(path)
}

function readFileUTF8(path)
{
	return fs.readFileSync(path, 'utf8')
}

function writeFileUTF8(path, data)
{
	return fs.writeFileSync(path, data, 'utf8')
}

function copyFileUTF8(sourePath, destinationPath)
{
	var data = readFileUTF8(sourePath)
	writeFileUTF8(destinationPath, data)
}

function cleanUp()
{
	console.log('Cleaning files')
	deleteFolder('./platforms')
	deleteFolder('./plugins')
}

function getAppVersion(cordovaContext)
{
	// Get version from config.xml.
	var ET = cordovaContext.requireCordovaModule('elementtree')
	var config = readFileUTF8('./config.xml')
	var tree = ET.parse(config)
	return tree.getroot().attrib.version
}

function getAppName(cordovaContext)
{
	// Get version from config.xml.
	var ET = cordovaContext.requireCordovaModule('elementtree')
	var config = readFileUTF8('./config.xml')
	var tree = ET.parse(config)
	return tree.findtext('./name');
}

function getPluginVersions(cordovaContext)
{
	// Get plugin versions from plugin.xml files.
	var ET = cordovaContext.requireCordovaModule('elementtree')
	var installedPlugins = getInstalledPlugins()
	if (!installedPlugins)
	{
		return null
	}
	return installedPlugins.map(function(pluginId) {
		var path = 'plugins/' + pluginId + '/plugin.xml'
		var plugin = readFileUTF8(path)
		var tree = ET.parse(plugin)
		var version = tree.getroot().attrib.version
		return { 'id': pluginId, 'version':version }
	})
}

function getInstalledPlugins()
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
function insertVersionInfo(cordovaContext, pathToIndexHtml)
{
	if (!fileExists(pathToIndexHtml)) { return }

	// Create HTML with plugin versions.
	var pluginVersions = getPluginVersions(cordovaContext)
	if (!pluginVersions) { return }

	var mapper = function(element) {
		return element.id + ' ' + element.version }
	var pluginVersionsHtml = pluginVersions.map(mapper).join('<br/>\n')

	// Insert version info into index.html.
	var data = readFileUTF8(pathToIndexHtml)
	data = data.replace(new RegExp('__APP_VERSION__', 'g'), getAppVersion(cordovaContext))
	data = data.replace(new RegExp('__PLUGIN_VERSIONS__', 'g'), pluginVersionsHtml)
	writeFileUTF8(pathToIndexHtml, data)
}

exports.execute = execute
exports.deleteFolder = deleteFolder
exports.fileExists = fileExists
exports.readFileUTF8 = readFileUTF8
exports.writeFileUTF8 = writeFileUTF8
exports.copyFileUTF8 = copyFileUTF8
exports.cleanUp = cleanUp
exports.getAppVersion = getAppVersion
exports.getAppName = getAppName
exports.getPluginVersions = getPluginVersions
exports.getInstalledPlugins = getInstalledPlugins
exports.insertVersionInfo = insertVersionInfo
