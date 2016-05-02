// Application code for the Evothings Viewer app.

// Application object.
var app = {}

// Production server address.
app.defaultServerAddress = 'https://deploy.evothings.com'

// Inserted by build script.
app.viewerVersion = '__APP_VERSION__'

app.initialize = function()
{
	// Called on page load and when going back to page using the back button.
	$(window).on('pageshow', function(event)
	{
		app.setConnectFieldText()
		app.setConnectButtonColor()
		app.setServerAddressField()
		app.showQuickConnectUI()
		app.loadAddOnScript()
	})

	// Not called when going back to page using the back button.
	$(function()
	{
		$('#menuitem-main').on('click', app.showMain)
		$('#menuitem-info').on('click', app.showInfo)
		$('#menuitem-settings').on('click', app.showSettings)
		$('#button-connect').on('click', app.onConnectButton)
		$('#input-connect-key').on('input', app.setConnectButtonColor)
	})
}

app.loadAddOnScript = function()
{
	var tryToLoadAgainTimeout = 1500

	// URL for the add-on script.
	//var url =
	//	app.getServerAddress() +
	//	'/server-www/static/evothings-viewer-addon-' +
	//	app.viewerVersion +
	//	'.js'
	
	// Moved add-on script to new location.
	var url =
		'https://evothings.com/viewer/evothings-viewer-addon-' +
		app.viewerVersion +
		'.js'

	function loadScript(loadedCallback, errorCallback)
	{
		evothings.loadScript(url, loadedCallback, errorCallback)
	}

	function errorCallback()
	{
		// Script could not load. Try loading it again in a while.
		setTimeout(
			function()
			{
				app.loadAddOnScript(loadedCallback, errorCallback)
			},
			tryToLoadAgainTimeout)
	}

	function loadedCallback()
	{
		// Empty.
	}

	// Initial load.
	loadScript(loadedCallback, errorCallback)

}

app.showQuickConnectUI = function()
{
	// First hide the quick-connect UI.
	$('#quick-connect-ui').html('')

	// Only show login/logout buttons if there is a saved client id.
	var clientID = app.getClientID()
	if (!clientID)
	{
		return
	}

	var serverAddress = app.getSessionServerAddress()
	if (serverAddress)
	{
		// Ask server for user name.
		var requestURL = serverAddress + '/get-info-for-client-id/' + clientID

		var request = $.ajax(
			{
				timeout: 5000,
				url: requestURL
			})

		// Process response.
		request.done(function(data)
		{
			if (data.isValid)
			{
				// We got a logged in user. Display login/logout buttons.
				app.showQuickConnectButtons(data.userName)
			}
		})

		request.fail(function(jqxhr)
		{
			app.showMessage('Could not get user info from server. Please check your Internet connection.')
		})
	}
}

app.showQuickConnectButtons = function(userName)
{
	var html =
		'<style>button { font-size:50%; width:100%; }</style>' +
		'<button id="button-connect" ' +
			'onclick="app.onLoginButton()" class="green">' +
			'Connect to<br/>' +  userName + '</button><br/>' +
		'<button id="button-connect" ' +
			'onclick="app.onLogoutButton()" class="red">' +
			'Logout<br/>' +  userName + '</button><br/>'
	$('#quick-connect-ui').html(html)
}

app.setConnectFieldText = function()
{
	// Empty the field and set a placeholder text.
	$('#input-connect-key').val('').attr('placeholder', 'Enter connect key')

	// If there is a saved URL display it.
	var savedURL = localStorage.getItem('saved-url')
	if (savedURL)
	{
		$('#input-connect-key').val(savedURL)
	}
}

app.setConnectButtonColor = function()
{
	var value = $('#input-connect-key').val().trim()
	if (value.length < 1)
	{
		$('#button-connect').removeClass('stone')
		$('#button-connect').addClass('charcoal')
	}
	else
	{
		$('#button-connect').removeClass('charcoal')
		$('#button-connect').addClass('stone')
	}
}

app.onConnectButton = function()
{
	app.showMessage('Connecting...')
	app.showSpinner()

	// Get contents of url text field.
	var keyOrURL = $('#input-connect-key').val().trim()

	// Is it a URL?
	if (app.checkIfURL(keyOrURL))
	{
		// Add protocol if not present.
		var url = app.addURLProtocolIfMissing(keyOrURL)

		// Save URL.
		localStorage.setItem('saved-url', url)

		// Open the URL.
		window.location.assign(url)

		app.hideSpinner()
	}
	else
	{
		// Not a URL, assuming a connect code. Clear saved URL.
		localStorage.removeItem('saved-url')

		// Check if the code exists and connect to the server if ok.
		app.getServerForConnectKey(keyOrURL)
	}
}

app.checkIfURL = function(url)
{
	// Does the string start with a valid URL protocol
	// or contain dots? Then it is assumed to be a URL.
	return (
		(0 == url.indexOf('http://')) ||
		(0 == url.indexOf('https://')) ||
		(0 < url.indexOf('.'))
	)
}

app.addURLProtocolIfMissing = function(url)
{
	// If there is no protocol in the URL we add http://
	if ((-1 == url.indexOf('http://')) &&
		(-1 == url.indexOf('https://')))
	{
		return 'http://' + url
	}
	else
	{
		// Protocol already present.
		return url
	}
}

app.onLoginButton = function()
{
	var clientID = app.getClientID()
	var serverAddress = app.getSessionServerAddress()
	if (clientID && serverAddress)
	{
		var serverURL = serverAddress + '/connect-with-client-id/' + clientID
		window.location.assign(serverURL)
	}
	else
	{
		app.showMessage('Could not connect to the last active session, please connect with a new connect key.')
	}
}

app.onLogoutButton = function()
{
	var clientID = app.getClientID()
	var serverAddress = app.getSessionServerAddress()
	if (clientID && serverAddress)
	{
		app.showSpinner()
		app.showMessage('Logging out...')

		var requestURL = serverAddress + '/logout-mobile-client/' + clientID
		var request = $.ajax(
			{
				timeout: 5000,
				url: requestURL
			})

		// If key exists, connect to Workbench.
		request.done(function(data)
		{
			app.showMessage('Logged out')
			app.hideSpinner()
			app.removeClientID()
			$('#quick-connect-ui').html('')
		})

		request.fail(function(jqxhr)
		{
			app.showMessage('Could not log out')
			app.hideSpinner()
		})
	}
	else
	{
		app.showMessage('Could not log out')
		app.hideSpinner()
	}
}

/**
 * Ask server set in app for which server to use to connect, based on the connect key.
 */
app.getServerForConnectKey = function(key)
{
	// Ask the default server for which server to use with this key.
	var requestURL = app.getServerAddress() + '/get-info-for-connect-key/' + key

	var request = $.ajax(
		{
			timeout: 5000,
			url: requestURL
		})

	request.done(function(data)
	{
		if (data.isValid && data.serverAddress)
		{
			// Store the server address for this key.
			localStorage.setItem('session-server-address', data.serverAddress)

			// Validate key with the server and connect.
			app.validateConnectKeyAndConnect(key, data.serverAddress)
		}
		else
		{
			app.showMessage('Could not find server for connect key, please retype the key or try with a new key.')
			app.hideSpinner()
		}
	})

	request.fail(function(jqxhr)
	{
		app.showMessage('Could not connect. Please check your Internet connection and try again.')
		app.hideSpinner()
	})
}

app.validateConnectKeyAndConnect = function(key, serverAddress)
{
	// Check that key exists.
	var requestURL = serverAddress + '/validate-connect-key/' + key
	var request = $.ajax(
		{
			timeout: 5000,
			url: requestURL
		})

	// If key exists, connect to Workbench.
	request.done(function(data)
	{
		if (!data.isValid)
		{
			app.showMessage('Invalid or expired key, please get a new key and try again.')
			app.hideSpinner()
		}
		else if (data.clientID)
		{
			// Store client id.
			app.setClientID(data.clientID)

			// Send device data.
			app.sendDeviceInfo(data.clientID, serverAddress)
		}
		else
		{
			app.showMessage('Something went wrong. Server did not respond as expected.')
			app.hideSpinner()
		}
	})

	request.fail(function(jqxhr)
	{
		app.showMessage('Could not validate the connect key. Please check your Internet connection and try again.')
		app.hideSpinner()
	})
}

app.sendDeviceInfo = function(clientID, serverAddress)
{
	// Send data about this device to the server.
	var data =
	{
		clientID: clientID,
		viewerUUID: app.getViewerUUID(),
		viewerVersion: app.viewerVersion
	}

	// Add device data if present.
	var deviceInfo = app.getDeviceInfo()
	if (deviceInfo)
	{
		data.deviceInfo = deviceInfo
	}

	var escapedData = encodeURIComponent(JSON.stringify(data))
	var requestURL = serverAddress + '/update-client-data/' + escapedData
	var request = $.ajax(
		{
			timeout: 5000,
			url: requestURL
		})

	// Connect to Workbench when call returns
	request.done(function()
	{
		// Connect.
		var serverURL = serverAddress + '/connect-with-client-id/' + clientID
		window.location.assign(serverURL)
		app.hideSpinner()
	})

	request.fail(function(jqxhr)
	{
		app.showMessage('Could not send data. Please check your Internet connection and try again.')
		app.hideSpinner()
	})
}

app.onSaveSettingsButton = function()
{
	var address = document.getElementById('input-server-address').value.trim()
	app.saveServerAddress(address)
}

// Set the server to the saved value, if any.
app.setServerAddressField = function()
{
	var serverAddress = app.getServerAddress()
	document.getElementById('input-server-address').value = serverAddress
}

app.saveServerAddress = function(address)
{
	// Save the server address.
	sessionStorage.setItem('server-address', address)

	// Clear the saved Workbench session address.
	localStorage.removeItem('session-server-address')

	// Go back to first screen.
	app.showMain()
}

app.getServerAddress = function()
{
	return sessionStorage.getItem('server-address') || app.defaultServerAddress
}

app.getSessionServerAddress = function()
{
	return localStorage.getItem('session-server-address')
}

app.showMessage = function(message)
{
	$('#message').html(message)
}

app.showSpinner = function()
{
	$('#spinner').show()
}

app.hideSpinner = function()
{
	$('#spinner').hide()
}

app.openBrowser = function(url)
{
	window.open(url, '_system', 'location=yes')
}

app.showMain = function()
{
	app.hideScreens()
	$('main').show()
	//$('header button.back').hide()
}

app.showInfo = function(event)
{
	app.hideScreens()
	$('#screen-info').show()
}

app.showSettings = function()
{
	app.hideScreens()
	$('#screen-settings').show()
}

app.hideScreens = function()
{
	$('main').hide()
	$('#screen-info').hide()
	$('#screen-settings').hide()
}

// The client id is a session-based ID, obtained from the server.
app.setClientID = function(id)
{
	return localStorage.setItem('client-id', id)
}

app.getClientID = function()
{
	return localStorage.getItem('client-id')
}

app.removeClientID = function()
{
	localStorage.removeItem('client-id')
}

// The Viewer UUID is a persistent id, generated by the Viewer.
app.getViewerUUID = function()
{
	// Get saved UUID.
	var uuid = localStorage.getItem('viewer-uuid')

	// Generate and store UUID if it does not exist.
	if (!uuid)
	{
		uuid = app.generateUUID()
		localStorage.setItem('viewer-uuid', uuid)
	}

	// Return UUID.
	return uuid
}

// Thanks to http://stackoverflow.com/a/8809472/4940311
app.generateUUID = function()
{
	var d = new Date().getTime()
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
		/[xy]/g,
		function(c)
		{
			var r = (d + Math.random()*16) % 16 | 0
			d = Math.floor(d/16)
			return (c == 'x' ? r : (r&0x3|0x8)).toString(16)
		})
}

app.getDeviceInfo = function()
{
	deviceInfo = null

	// Cordova device properties:
	// https://www.npmjs.com/package/cordova-plugin-device
	// Note that the device object may not be present.
	if (typeof device == 'object')
	{
		deviceInfo = {}
		deviceInfo.cordova = device.cordova
		deviceInfo.model = device.model
		deviceInfo.platform = device.platform
		deviceInfo.uuid = device.uuid
		deviceInfo.version = device.version
		deviceInfo.isVirtual = device.isVirtual
		deviceInfo.serial = device.serial
	}

	return deviceInfo
}

// App main entry point.
app.initialize()
