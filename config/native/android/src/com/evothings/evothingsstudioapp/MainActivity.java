/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package com.evothings.evothingsstudioapp;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import java.io.IOException;
import java.io.File;
import java.io.FileNotFoundException;

import org.apache.cordova.CordovaResourceApi.OpenForReadResult;
import org.apache.cordova.*;

public class MainActivity extends CordovaActivity
{
	@Override
	public void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);
		super.init();

		// If the intent has a data string we load it.
		Intent intent = getIntent();
		if (isEvothingsIntent(intent))
		{
			openEvothingsIntent(intent);
		}
		else
		{
			// This is the original Cordova page loading code.
			// Set by <content src="index.html" /> in config.xml
			super.loadUrl(Config.getStartUrl());
			//super.loadUrl("file:///android_asset/www/index.html")
		}
	}

	@Override
	protected void onNewIntent(Intent intent)
	{
		if (isEvothingsIntent(intent))
		{
			openEvothingsIntent(intent);
		}
		else
		{
			super.onNewIntent(intent);
		}
	}

	protected boolean isEvothingsIntent(Intent intent)
	{
		String url = intent.getDataString();
		if (null != url)
		{
			return url.startsWith("evothings:");
		}
		else
		{
			return false;
		}
	}

	protected void openEvothingsIntent(Intent intent)
	{
		// Get the URL string of the intent.
		String url = intent.getDataString();

		// Strip off "evothings" from the URL and replace with "http".
		url = "http" + url.substring(9);

		// Load the URL in the Cordova web view.
		this.appView.loadUrlIntoView(url);
	}

	// For Cordova 3.1+
	@Override
	protected CordovaWebViewClient makeWebViewClient(CordovaWebView webView)
	{
		// If Android version is lover than HONEYCOMB we are toast
		// (loading of local Cordova files won't work in this case).
		return (android.os.Build.VERSION.SDK_INT <
				android.os.Build.VERSION_CODES.HONEYCOMB)
			? new CordovaWebViewClient(this, webView)
			: new EvothingsWebViewClient(this, webView);
	}

	public class EvothingsWebViewClient extends IceCreamCordovaWebViewClient
	{
		public EvothingsWebViewClient(CordovaInterface cordova, CordovaWebView view)
		{
			super(cordova, view);
		}

		@Override
		public WebResourceResponse shouldInterceptRequest(WebView view, String url)
		{
			String localURL = getCordovaLocalFileURL(url);
			if (null != localURL)
			{
				return handleCordovaURL(view, localURL, url);
			}
			else if (url.startsWith("evothings:"))
			{
				// Replace the 'evothings' protocol with 'http'.
				url = "http" + url.substring(9);
			}

			return super.shouldInterceptRequest(view, url);
		}

		@Override
		public boolean shouldOverrideUrlLoading(WebView view, String url)
		{
			if (url.startsWith("evothings:"))
			{
				// Replace the 'evothings' protocol with 'http'.
				url = "http" + url.substring(9);
				appView.loadUrlIntoView(url);
				return true;	// we handled it.
			}
			else
			{
				return false;	// system handles it.
			}
		}

		/**
		 * Here we check for Cordova files and directories.
		 * @return If the URL names an existing Cordova asset,
		 * the local URL is returned. Otherwise null is returned.
		 */
		String getCordovaLocalFileURL(String url)
		{
			int i;

			i = url.indexOf("/cordova.js");
			if (-1 < i)
			{
				return "file:///android_asset/www" + url.substring(i);
			}

			i = url.indexOf("/cordova_plugins.js");
			if (-1 < i)
			{
				return "file:///android_asset/www" + url.substring(i);
			}

			i = url.indexOf("/plugins/");
			if (-1 < i)
			{
				return "file:///android_asset/www" + url.substring(i);
			}

			// Not a Cordova file or directory.
			return null;
		}

		WebResourceResponse handleCordovaURL(
			WebView view,
			String assetURL,
			String originalURL)
		{
			try
			{
				CordovaResourceApi resourceApi = appView.getResourceApi();
				Uri uri = Uri.parse(assetURL);

				String encoding = "UTF-8";
				OpenForReadResult result = resourceApi.openForRead(uri, true);
				return new WebResourceResponse(
					result.mimeType,
					encoding,
					result.inputStream);
			}
			catch (FileNotFoundException e)
			{
				return super.shouldInterceptRequest(view, originalURL);
			}
			catch (IOException e)
			{
				LOG.e("EvothingsWebViewClient", "Error occurred while loading a file (returning a 404).", e);
				// Results in a 404.
				return new WebResourceResponse("text/plain", "UTF-8", null);
			}
		}
	}
}
