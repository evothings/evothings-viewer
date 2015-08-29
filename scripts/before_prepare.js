#!/usr/bin/env node

module.exports = function(context)
{
	console.log('@@@ before_prepare')

	var PLUGINS = require('./plugins.js')

	PLUGINS.addPlugins()
}
