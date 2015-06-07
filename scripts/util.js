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

exports.execute = execute
exports.deleteFolder = deleteFolder
exports.fileExists = fileExists
exports.readFileUTF8 = readFileUTF8
exports.writeFileUTF8 = writeFileUTF8
exports.copyFileUTF8 = copyFileUTF8
exports.cleanUp = cleanUp
