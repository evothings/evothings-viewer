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
//
//  main.m
//  Evothings
//
//  Created by Mikael Kindborg.
//  Copyright Evothings AB 2014. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface URLProtocolCordovaJs : NSURLProtocol
@end

static NSString* pathCordovaJs = @"/cordova.js";
static NSString* pathCordovaPluginJs = @"/cordova_plugins.js";
static NSString* pathPlugins = @"/plugins";

int main(int argc, char* argv[])
{
	@autoreleasepool {
		[NSURLProtocol registerClass:[URLProtocolCordovaJs class]];
		int retVal = UIApplicationMain(argc, argv, nil, @"AppDelegate");
		return retVal;
	}
}

static NSError* createError()
{
	NSError* error =
		[NSError
		errorWithDomain: @"/"
		code: -1
		userInfo: nil];
	return error;
}

static NSString* createMimeType(NSString* pathExtension)
{
	NSString* mimeType;
	if ([pathExtension isEqualToString: @"js"])
	{
		mimeType = @"application/javascript";
	}
	else
	{
		mimeType = @"text/html";
	}
	return mimeType;
}

// Check if string contains substring.
static BOOL stringContains(NSString* string, NSString* substring)
{
	if (!string) { return NO; }
	if (!substring) { return NO; }
	NSRange range = [string rangeOfString: substring];
	BOOL found = (range.location != NSNotFound);
	return found;
}

// Get the string starting with substring.
static NSString* stringSubstring(NSString* string, NSString* substring)
{
	if (!string) { return nil; }
	if (!substring) { return nil; }
	NSRange range = [string rangeOfString: substring];
	BOOL found = (range.location != NSNotFound);
	if (found)
	{
		return [string substringFromIndex: range.location];
	}
	else
	{
		return nil;
	}
}

// Get the Cordova part of the path.
static NSString* cordovaSubPath(NSString* path)
{
	NSString* subpath;

	if (!path) { return nil; }

	subpath = stringSubstring(path, pathCordovaJs);
	if (subpath) { return subpath; }

	subpath = stringSubstring(path, pathCordovaPluginJs);
	if (subpath) { return subpath; }

	subpath = stringSubstring(path, pathPlugins);
	if (subpath) { return subpath; }

	return nil;
}

// Get the full Cordova file path in the app bundle.
static NSString* cordovaFilePath(NSString* path)
{
	NSString* filePath = [NSString
		stringWithFormat: @"%@/www%@",
		[[NSBundle mainBundle] bundlePath],
		cordovaSubPath(path)];
	return filePath;
}

static BOOL pathIsCordovaJsFile(NSString* path)
{
	// First test if the path could be a local Cordova JS file.
	BOOL isCordovaPath = stringContains(path, pathCordovaJs)
		|| stringContains(path, pathCordovaPluginJs)
		|| stringContains(path, pathPlugins);
	if (!isCordovaPath) { return NO; }

	// Now see if the file exists.
	NSString* filePath = cordovaFilePath(path);
	BOOL fileExists = [[NSFileManager defaultManager]
		fileExistsAtPath: filePath];
	return fileExists;
}

@implementation URLProtocolCordovaJs

+ (BOOL)canInitWithRequest:(NSURLRequest*)theRequest
{
	// If the URL is a file: URL we do not need to handle it.
	if ([theRequest.URL isFileURL]) { return NO; }

	NSString* path = theRequest.URL.path;
	if (!path) { return NO; }

	return pathIsCordovaJsFile(path);
}

+ (NSURLRequest*)canonicalRequestForRequest:(NSURLRequest*)theRequest
{
	return theRequest;
}

- (void)startLoading
{
	NSString* path = self.request.URL.path;
	NSString* filePath = cordovaFilePath(path);

	BOOL success = FALSE;

	if (nil != filePath)
	{
		NSData* data = [NSData dataWithContentsOfFile: filePath];
		if (nil != data)
		{
			NSString* pathExtension = self.request.URL.pathExtension;
			NSString* mimeType = createMimeType(pathExtension);
			NSURLResponse* response = [[NSURLResponse alloc]
			   initWithURL: self.request.URL
			   MIMEType: mimeType
			   expectedContentLength: -1
			   textEncodingName: nil];
			[[self client]
				URLProtocol: self
				didReceiveResponse: response
				cacheStoragePolicy: NSURLCacheStorageNotAllowed];
			[[self client] URLProtocol: self didLoadData: data];
			[[self client] URLProtocolDidFinishLoading: self];
			success = TRUE;
		}
	}

	if (!success)
	{
		[[self client]
			URLProtocol: self
			didFailWithError: createError()];
	}
}

- (void)stopLoading
{
	// NSLog(@"request cancelled. stop loading the response, if possible");
}

@end
