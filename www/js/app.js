// Application code for the Evothings Viewer app.

// Debug logging used when developing the app in Evothings Studio.
if (window.hyper && window.hyper.log) { console.log = hyper.log; console.error = hyper.log }

// Application object.
var app = {}

// Production server address.
app.serverAddress = 'http://staging.evothings.com:8081'

app.initialize = function()
{
	document.addEventListener('deviceready', app.onDeviceReady, false)

	app.hideSpinner()

	$('#menuitem-main').on('click', app.showMain)
	$('#menuitem-info').on('click', app.showInfo)
	$('#menuitem-settings').on('click', app.showSettings)

	$(function()
	{
		FastClick.attach(document.body)

		app.setSavedServerAddress()

		// For debugging. TODO: Remove.
		app.onDeviceReady()
	})
}

app.onDeviceReady = function()
{
	app.displayExtraUI()
}

app.displayExtraUI = function()
{
	// Display login/logout buttons if there is a saved client id.
	var clientID = localStorage.getItem('client-id')
	if (!clientID)
	{
		$('#extra-ui').html('')
		return
	}

	app.showMessage('Checking login status...')
	app.showSpinner()

	// Ask server for user name.
	var requestURL = app.serverAddress + '/check-client-id/' + clientID
	var request = $.ajax(
		{
			timeout: 5000,
			url: requestURL,
		})

	// Process response.
	request.done(function(data)
	{
		app.hideSpinner()

		// For debugging.
		// TODO: Remove.
		app.showMessage('Last logged in user: ' + data.userName)

		if (data.isValid)
		{
			// We got a logged in user. Display login/logout buttons.
			displayButtons(data.userName)
		}
	})

	request.fail(function(jqxhr)
	{
		app.showMessage('Could not connect to server. Please check your Internet connection and try again.')
		app.hideSpinner()
	})

	function displayButtons(userName)
	{
		var html =
			'<style>button { font-size:65%; }</style>' +
			'<button id="button-connect" ' +
				'onclick="app.onLoginButton()" class="green">' +
				'Connect as<br/>' +  userName + '</button><br/>' +
			'<button id="button-connect" ' +
				'onclick="app.onLogoutButton()" class="red">' +
				'Logout<br/>' +  userName + '</button><br/>'
		$('#extra-ui').html(html)
	}
}

app.onConnectButton = function()
{
	app.showMessage('Connecting...')
	app.showSpinner()

	// Get contents of url text field.
	var keyOrURL = document.getElementById('input-connect-key').value.trim()

	// Does it look like a URL?
	if ((0 == keyOrURL.indexOf('http://')) ||
		(0 == keyOrURL.indexOf('https://')))
	{
		// Open the URL.
		window.location.assign(keyOrURL)
	}
	else
	{
		// Not a URL, assuming a connect code.
		// Check if the code exists and connect to the server if ok.
		app.connectWithKey(keyOrURL)
	}
}

app.onLoginButton = function()
{
	var clientID = localStorage.getItem('client-id')
	var serverURL = app.serverAddress + '/connect-with-client-id/' + clientID
	window.location.assign(serverURL)
}

app.onLogoutButton = function()
{
	var clientID = localStorage.getItem('client-id')
	app.showMessage('Logging out...')
	app.showSpinner()

	var requestURL = app.serverAddress + '/logout-mobile-client/' + clientID
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
		$('#extra-ui').html('')
	})

	request.fail(function(jqxhr)
	{
		app.showMessage('Could not log out')
		app.hideSpinner()
	})
}

app.connectWithKey = function(key)
{
	console.log('app.connectWithKey: ' + key)

	// Check that key exists.
	var requestURL = app.serverAddress + '/check-connect-key-return-client-id/' + key
	var request = $.ajax(
		{
			timeout: 5000,
			url: requestURL,
		})

	// If key exists, connect to Workbench.
	request.done(function(data)
	{
		app.showMessage('Result: ' + JSON.stringify(data))
		console.log('Data: ' + JSON.stringify(data))

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
			var serverURL = app.serverAddress + '/connect-with-client-id/' + data.clientID
			window.location.assign(serverURL)
		}
		else
		{
			app.showMessage('Something went wrong. Server did not respond as expected. Please report this error.')
			app.hideSpinner()
		}
	})

	request.fail(function(jqxhr)
	{
		app.showMessage('Could not connect. Please check your Internet connection and try again.')
		app.hideSpinner()
	})
}

app.onSaveSettingsButton = function()
{
	var address = document.getElementById('input-server-address').value.trim()
	app.saveServerAddress(address)
}

// Set the server to the saved value, if any.
app.setSavedServerAddress = function()
{
	app.serverAddress = localStorage.getItem('server-address') || app.serverAddress
	document.getElementById("input-server-address").value = app.serverAddress
	console.log('app.serverAddress: ' + app.serverAddress)
}

app.saveServerAddress = function(address)
{
	// Save the server address.
	localStorage.setItem('server-address', address)
	app.serverAddress = address

	// Go back to the main screen.
	setTimeout(app.showMain, 500)
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
