#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var sys = require('sys')
var process = require('child_process')

var packageJson = require('../package.json')

function main()
{
	cleanUp()
	addPlatforms()
	addPlugins()
}

function cleanUp()
{
	console.log('Cleaning files')
	deleteFolder('./platforms')
	deleteFolder('./plugins')
}

function addPlatforms()
{
	execute('cordova platform add ios')
	execute('cordova platform add android')
}

function addPlugins()
{
	packageJson.plugins.forEach(function(plugin)
	{
		execute('cordova plugin add ' + plugin)
	})
}

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

main()
