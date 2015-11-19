// Application code for the Evothings Viewer app.

// Debug logging used when developing the app in Evothings Studio.

/*
if (window.hyper && window.hyper.log)
{
	console.log = hyper.log
	console.error = hyper.log
}
*/

// Application object.
var app = {}

// Production server address.
app.defaultServerAddress = 'https://deploy.evothings.com'

app.initialize = function()
{
	//console.log('app.initialize')

	// Called when going back to page using the back button.
	$(window).on('pageshow', function(event)
	{
		//console.log('pageshow')

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
		//console.log('page loaded')

		$('#menuitem-main').on('click', app.showMain)
		$('#menuitem-info').on('click', app.showInfo)
		$('#menuitem-settings').on('click', app.showSettings)
		$('#button-connect').on('click', app.onConnectButton)
		$('#input-connect-key').on('input', app.setConnectButtonColor)

		FastClick.attach(document.body)

		app.showCachedApps()
	})
}

//*************************** CLIENT CACHE CODE START *************************

app.showCachedApps = function()
{
	$('#hyper-cache-message').html("Fetching cache list...")
	$.ajax("evocachemeta:app-list.json")
	.done(function(data, textStatus, xhr)
	{
		//console.log(JSON.stringify(data))
		var cachedApps = data["apps"]

		if (!cachedApps)
		{
			var msg = 'No apps cached.'
			$('#hyper-cache-message').html(msg)
		}
		else if(Object.keys(cachedApps).length == 0)
		{
			var msg = Object.keys(cachedApps).length+' apps cached.'
			$('#hyper-cache-message').html(msg)
		}
		else
		{
			var list = ''
			var count = 0
			for(var appName in cachedApps)
			{
				var cachedApp = cachedApps[appName]
				list +=
					'<a href="'+cachedApp.url+'"><li class="arrow" id="ca'+count+'">' +
					'<strong>'+appName+'</strong>' +
					'</li></a>'
				count += 1
			}
			$('#hyper-cache-list').html(list)
			$('#hyper-cache-message').html("")
			count = 0
			for(var appName in cachedApps)
			{
				var cachedApp = cachedApps[appName];
				// wrap variables in function to avoid for-loop madness.
				(function(_appName, _cachedApp, _count)
				{
					// longpress pops up a menu with DELETE <todo: and some other (info) choices>.
					app.longPress('ca'+_count, function() { app.showCachedAppMenu(_appName, _cachedApp); });
				})(appName, cachedApp, count);
				count += 1
			}
		}
	})
	.fail(function(xhr, textStatus, errorThrown)
	{
		$('#hyper-cache-nessage').html("ajax fail")
		var msg = "$.ajax.fail2("+textStatus+", "+errorThrown+")"
		console.log(msg)
	})
	app.longPress('hyper-cache-title', function() {})
}

app.createMenu = function()
{
	var bg = document.createElement('div')
	bg.id = 'hyper-cached-app-background'
	bg.style.width = '100%'
	bg.style.height = '100%'
	bg.style.left = '0'
	bg.style.top = '0'
	bg.style.position = 'absolute'
	bg.style.background = 'rgba(0,0,0,0.5)'
	bg.style.visibility = 'visible'
	bg.style.zIndex = '999998'

	// remove the menu if you click on the background.
	bg.addEventListener('click', function()
	{
		document.body.removeChild(bg)
	})

	// create the menu itself
	var menu = document.createElement('div')

	menu.id = 'hyper-cached-app-menu'
	menu.style.width = '80%'
	menu.style.position = 'absolute'
	menu.style.left = '5%'
	menu.style.bottom = '40%'
	menu.style.padding = '5% 5%'
	menu.style.borderRadius = '4%'
	menu.style.MozBorderRadius = '4%'
	menu.style.WebkitBorderRadius = '4%'
	menu.style.background = '#FFFFFF'
	menu.style.opacity = '1'
	menu.style.border = '1px solid #000000'
	menu.style.fontFamily = 'sans-serif'
	menu.style.fontSize = '18pt'
	menu.style.fontWeight = 'bold'
	menu.style.color = '#000000'
	menu.style.textAlign = 'center'
	menu.style.visibility = 'visible'
	menu.style.zIndex = '999999'

	bg.appendChild(menu)
	document.body.appendChild(bg)

	return menu
}

app.createMenuItem = function(data)
{
	var item = document.createElement('div')
	item.innerHTML = data.text
	// we want the background to be removed here, but its own click handler will take care of that.
	item.addEventListener('click', data.action)
	return item
}

// pop up a yes/cancel dialog box. call yesFunction if the user clicks "yes".
app.yesOrCancel = function(questionText, yesFunction)
{
	return function()
	{
		var resultCallback = function(buttonIndex)
		{
			if(buttonIndex == 1)
				yesFunction()
		}
		navigator.notification.confirm(questionText, resultCallback)
	}
}

app.showCachedAppMenu = function(appName, cachedApp)
{
	var menuItems =
	[
		{
			text: 'DELETE',
			action: app.yesOrCancel("Delete "+appName+"?", function() { window.location.replace('evocachemeta:delete/'+cachedApp.index); }),
		},
	]

	var menu = app.createMenu()

	for(var i in menuItems)
	{
		var item = app.createMenuItem(menuItems[i])
		menu.appendChild(item)
	}
}

app.longPress = function(id, callback)
{
	var pressTimer
	var el = document.getElementById(id)

	el.addEventListener('touchend', function()
	{
		el.style.backgroundColor = "#f3f3f3"
		clearTimeout(pressTimer)
		// Clear timeout
		return false;
	})
	el.addEventListener('touchstart', function()
	{
		el.style.backgroundColor = "#656565"
		// Set timeout
		pressTimer = window.setTimeout(function()
		{
			el.style.backgroundColor = "#f3f3f3"
			callback()
		}, 1000)
		return false;
	})
}

//*************************** CLIENT CACHE CODE END *************************

app.loadAddOnScript = function(loadedCallback)
{
	var url = app.getServerAddress() + '/server-www/static/evothings-viewer-addons.js'
	evothings.loadScript(url, loadedCallback)
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

	// Does it look like a URL?
	if ((0 == keyOrURL.indexOf('http://')) ||
		(0 == keyOrURL.indexOf('https://')))
	{
		// Open the URL.
		window.location.assign(keyOrURL)
		app.hideSpinner()
	}
	else
	{
		// Not a URL, assuming a connect code.
		// Check if the code exists and connect to the server if ok.
		app.getServerForConnectKey(keyOrURL)
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
