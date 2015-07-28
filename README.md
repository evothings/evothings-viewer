## Evothings Studio App

### Introduction

This is the companion app to [Evothings Studio 2.0](https://github.com/evothings/evothings-studio/tree/evothings2) (note that the code for Evothings Studio 2.0 is in branch "evothings2").

The app consists of a Cordova WebView, a number of useful plugins, and a UI to connect to Evothings Studio Workbench.

### Building the App

To build the app, you need Apache Cordova installed. Here are the build steps:

Clone this repository:

    git clone git@github.com:evothings/evothings-studio-app.git

Go to the repository directory:

    cd evothings-studio-app

Add your platforms:

    cordova add android
    cordova add ios

An alternative method to add platforms is to run the init.js script, which will add the platforms listed in package.json:

    node scripts/init.js

Then build using Cordova, this will add plugins first time you build either of:

    cordova build android
    cordova build ios

You can edit package.json to configure which plugins you wish to be included and the platforms added by init.js.

To clean up the project, run init.js.

### Build system overview

The build uses plain Cordova features (hooks and plugins) and is designed to be easy to use for people who know Cordova.

There are build hooks in the "scripts" directory, these are invoked to copy/modify files during the build process.

To make native application settings on Android and iOS a plugin in folder config/config-plugin is used. This plugin has no source files, it is there only to make project settings (a plugin can modify AndroidManifest.xml entries and info.plist entries, which cannot be done using config.xml).

Icons and launch screens are specified in config.xml.

Source code files in the config folder are copied to the target platform directory during build, for both Android and iOS. These source files contains special modifications for the Evothings app.

To clean the project use the command:

    node scripts/init.js

This removes projects and plugins, and adds Android and iOS platforms. Plugins are added when the project is then built for the first time.

### Known Cordova build bugs

#### On iOS *-info.plist items are duplicated on each Cordova build

Issue exists:

https://issues.apache.org/jira/browse/CB-9354

Fix exists:

https://github.com/apache/cordova-lib/pull/256

Workaround:

cordova platform rm ios
cordova platform add ios

The iOS project should now be "clean" and ready to build using Xcode.

#### On iOS *-info.plist items for interface orientations are deleted on Cordova build

No issue report known to exist.

Workaround:

cordova platform rm ios
cordova platform add ios

The iOS project should now be ready to build using Xcode. That is, do not build using "cordova build ios", because then the orientation settings are gone (you can add them manually in Xcode however).
