/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.	 The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.	You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

//
//	AppDelegate.m
//

#import "AppDelegate.h"
#import "MainViewController.h"

@implementation AppDelegate

- (BOOL) application: (UIApplication*)application
	didFinishLaunchingWithOptions: (NSDictionary*)launchOptions
{
	self.viewController = [[MainViewController alloc] init];
	return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (BOOL) application: (UIApplication*)application
		openURL: (NSURL*)url
		sourceApplication: (NSString*)sourceApplication
		annotation: (id)annotation
{
	return [self evobleOpenURL: url];
}

- (BOOL) application: (UIApplication*)app
		openURL: (NSURL*)url
		options: (NSDictionary<NSString*,id>*)options
{
	return [self evobleOpenURL: url];
}

- (BOOL) evobleOpenURL: (NSURL*)url
{
	if (url && [self.viewController.webView isKindOfClass:[UIWebView class]])
	{
		NSLog(@"@@@ [AppDelegate.m] evobleOpenURL url scheme: %@", [url scheme]);

		// Use https for scheme "evos".
		NSString* httpScheme =
			[[url scheme] isEqualToString: @"evos"] ? @"https" : @"http";

		// Load the given URL into the web view.
		NSString* targetURL =
			[NSString
				stringWithFormat: @"%@:%@",
				httpScheme,
				[url resourceSpecifier]];
		NSURLRequest* request =
			[NSURLRequest
				requestWithURL: [NSURL URLWithString: targetURL]
				cachePolicy: NSURLRequestReloadIgnoringLocalAndRemoteCacheData
				timeoutInterval: 10];

		NSLog(@"@@@ [AppDelegate.m] evobleOpenURL targetURL: %@", targetURL);
		
		[(UIWebView*)self.viewController.webView loadRequest: request];

		// all plugins will get the notification, and their handlers will be called
		[[NSNotificationCenter defaultCenter] postNotification:
			[NSNotification
				notificationWithName: CDVPluginHandleOpenURLNotification
				object: url]];

		return YES;
	}
	else
	{
		return NO;
	}
}

@end
