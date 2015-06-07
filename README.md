## Evothings Studio App

### Introduction

This is the companion app to [Evothings Studio 2.0](https://github.com/evothings/evothings-studio/tree/evothings2) (note that the code for Evothings Studio 2.0 is in branch "evothings2").

The app consists of a Cordova WebView, a number of useful plugins, and a UI to connect to Evothings Studio Workbench.

### Building the App

To build the app, you need Apache Cordova. Here are the build steps:

Clone this repository:

    git clone git@github.com:evothings/evothings-studio-app.git

Go to the app directory:

    cd evothings-studio-app

Add your platforms:

    cordova add android
    cordova add ios

As an alternative to adding platforms manually, run the init.js script which will add the platforms listed in package.json:

    node scripts/init.js

Then build, this will add plugins first time you build:

    cordova build android
    cordova build ios

You can edit package.json to configure which plugins you wish to be included and the platforms added by init.js.

To clean up the project, run init.js.
