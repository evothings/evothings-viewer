// Application code for the Evothings Studio App.

// Debug logging used when developing the app in Evothings Studio.
if (window.hyper && window.hyper.log) { console.log = hyper.log; console.error = hyper.log }

// Application object.
var app = {}

// Production server address.
var SERVER_ADDRESS = 'http://evothings.com:8081'

// Use your machine's IP address for testing.
//var SERVER_ADDRESS = 'http://192.168.43.247:8081' // Micke's test address

app.initialize = function()
{
	document.addEventListener('deviceready', app.onDeviceReady, false)

	app.hideSpinner()

	// Page navigation.
	$('#info_button').bind('click', {articleId: 'info'}, app.showArticle)

	$(function()
	{
		//FastClick.attach(document.body)
	})
}

app.onDeviceReady = function()
{
}

app.onConnectButton = function()
{
	app.showMessage('Connecting...')
	app.showSpinner()

	// Get contents of url text field.
	var keyOrURL = document.getElementById('hyper-key').value.trim()

	// Is it a key code?
	if (/^\d{4}$/.test(keyOrURL))
	{
		// Check if the code exists and connect to the server if ok.
		app.connectWithKey(keyOrURL)
	}
	else if (0 == keyOrURL.indexOf('http://'))
	{
		// This looks like a URL, launch it.
		window.location.assign(keyOrURL)
	}
	else
	{
		// Neither key nor URL. Display message.
		app.showMessage('Please enter a connect key or URL.')
		app.hideSpinner()
	}
}

app.connectWithKey = function(key)
{
	// Check that key exists.
	var requestURL = SERVER_ADDRESS + '/check-connect-key/' + key
	var request = $.ajax(
		{
			timeout: 5000,
			url: requestURL,
		})

	// If key exists, connect to Workbench.
	request.done(function(data)
	{
		app.showMessage('Result: ' + data)

		if ('KEY-OK' == data)
		{
			// Connect to server.
			var serverURL = SERVER_ADDRESS + '/connect/' + key
			app.showMessage('Connecting to: ' + serverURL)
			window.location.assign(serverURL)
		}
		else if ('KEY-NOT-OK' == data)
		{
			app.showMessage('Invalid or expired key, please get a new key and try again.')
			app.hideSpinner()
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

app.showMessage = function(message)
{
	$('#hyper-message').html(message)
}

app.showSpinner = function()
{
	$('#hyper-spinner').show()
}

app.hideSpinner = function()
{
	$('#hyper-spinner').hide()
}

app.openBrowser = function(url)
{
	window.open(url, '_system', 'location=yes')
}

app.showArticle = function(event)
{
	var articlePage = $('article#' + event.data.articleId)

	$('main').toggle()
	articlePage.toggle()

	if (articlePage.is(":visible"))
		$(this).text('Connect')
	else
		$(this).text('Info')
}

app.showMain = function()
{
	$('main').show()
	$('article').hide()
	$('#info_button').text('Info')
	$('header button.back').hide()
}

// App main entry point.
app.initialize()

