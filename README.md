## Evothings Viewer

### Introduction

Evothings Viewer is the companion app for [Evothings Studio 2.x](https://github.com/evothings/evothings-studio/). It is used to connect to Evothings Workbench and run apps.

The app consists of a Cordova WebView, a number of useful plugins, and a UI to connect to Evothings Studio Workbench. You can edit the list of plugins in file package.json and build your custom version of the Viewer.

### Notice when building from source

Currently, Cordova version 6.0.0 or higher is needed to build the Viewer.

Branch master may contain updates not yet compatible with current production servers. If building from master branch does not work, of if you want to play safe, use [the latest release](https://github.com/evothings/evothings-viewer/releases). Building from master branch should work fine in most cases and gives you the latest updates.

### Building the App

To build the app, you need Apache Cordova installed. Here are the build steps:

Download and unpack the source for the latest release:

    https://github.com/evothings/evothings-viewer/releases

Alternatively, clone the repository using git (gives you current master branch):

	git clone git@github.com:evothings/evothings-viewer.git

Go to the source directory:

    cd evothings-viewer

Add your platforms:

    cordova platform add android
    cordova platform add ios

Then build using Cordova:

    cordova build android
    cordova build ios

Plugins will be added automatically first time you add a platform.

You can edit [package.json](package.json) to configure which plugins you wish to be included. New plugins are added on next build.

To clean up the project run (removes folders 'platforms' and 'plugins', you can also delete these folders manually):

    node scripts/clean.js

You should run clean.js after having removed plugins from package.json, to get a fresh build.

### Build system overview


The build uses plain Cordova features (hooks and plugins) and is designed to be easy to use for people who know Cordova.

There are build hooks in the 'scripts' directory, these are invoked to copy/modify files during the build process.

To make native application settings on Android and iOS a plugin in folder config/config-plugin is used. This plugin has no source files, it is there only to make project settings (a plugin can modify AndroidManifest.xml entries and info.plist entries, which cannot be done using config.xml).

Icons and launch screens are specified in config.xml.

Source code files in the 'config' folder are copied to the target platform directory during build, for both Android and iOS. These source files contains special modifications for the Evothings app.

To clean the project use the command:

    node scripts/clean.js

This removes projects and plugins. Add platforms using 'cordova platform add ...'. Plugins are added when adding the first platform.

### Setting a custom package name

Change the package name in [config.xml](config.xml) on this line:

    <widget id="com.evothings.evothingsviewer"

You can also change the app name, modify this line in [config.xml](config.xml):

    <name>Viewer</name>

### Known build issues on iOS

#### Settings for iPhone/iPad interface orientations

Due to some glitch in the Cordova build process and/or Xcode, you should set interface orientations manually in Xcode, go to the tab 'General' and make desired settings under 'iPhone' and 'Device Orientation'.

