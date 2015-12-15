// Application code for the Evothings Viewer app.

// Application object.
var app = {}

// Production server address.
app.defaultServerAddress = 'https://deploy.evothings.com'

app.initialize = function()
{
	// Called on page load and when going back to page using the back button.
	$(window).on('pageshow', function(event)
	{
		app.setConnectFieldText()
		app.setConnectButtonColor()
		app.setServerAddressField()

		app.loadAddOnScript(
			function()
			{
				app.showQuickConnectUI()
			})
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

app.loadAddOnScript = function(loadedCallback)
{
	var tryToLoadScriptTimeout = 2000

	function errorCallback()
	{
		// Script could not load. Try loading it again in a while.
		setTimeout(
			function()
			{
				app.loadAddOnScript(loadedCallback, errorCallback)
			},
			tryToLoadScriptTimeout)
	}

	// Load the script.
	var url = app.getServerAddress() +
		'/server-www/static/evothings-viewer-addon-1.2.0.js'
	url = 'https://evothings.com/uploads/evothings2/beta3/evothings-viewer-addon-1.2.0.js'
	evothings.loadScript(url, loadedCallback, errorCallback)
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
				url: requestURL,
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
			'Connect as<br/>' +  userName + '</button><br/>' +
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
				url: requestURL,
			})

		// If key exists, connect to Workbench.
		request.done(function(data)
		{
			app.showMessage('Logged out')
			app.hideSpinner()
			localStorage.removeItem('client-id')
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
			url: requestURL,
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
			url: requestURL,
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
			localStorage.setItem('client-id', data.clientID)

			// Connect.
			var serverURL = serverAddress + '/connect-with-client-id/' + data.clientID
			window.location.assign(serverURL)
			app.hideSpinner()
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

	// Reload the add-on script after change of server address.
	app.loadAddOnScript(function()
	{
		// Go back to the main screen.
		app.showMain()
	})
}

app.getServerAddress = function()
{
	return sessionStorage.getItem('server-address') || app.defaultServerAddress
}

app.getSessionServerAddress = function()
{
	return localStorage.getItem('session-server-address')
}

app.getClientID = function()
{
	return localStorage.getItem('client-id')
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

// App main entry point.
app.initialize()
