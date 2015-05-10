# Build script for the Evothings Studio app.
#
# Dependencies - The following directory structure is required to build:
# cordova-ble
# cordova-plugin-ibeacon
# evothings-studio-app
# evothings-examples
# mobile-chrome-apps
# BluetoothSerial
# cordova-plugin-local-notifications
# phonegap-estimotebeacons
#
# All directories that don't exist will be created by the script, except evothings-examples.
# That one you must clone manually.
#
# The workfile is not responsible for keeping the plugins up-to-date; you must do this manually.
#
# Possible build switches are:
# c - clean target platform before building
# ca - clean everything before building (removes platforms, plugins and documentation)
# i - install after building
# android - build Android
# wp8 - build Windows Phone 8
# ios - build iOS
# doc - build documentation instead of cordova app
#
# By default, Android will be built.
# Only one platform may be built per invocation.
#
# Examples:
# ruby build.rb
# ruby build.rb i
# ruby build.rb c i
# ruby build.rb ios
# ruby build.rb c ios
#
# An optional config file named localConfig.rb can define
# build constants and additional plugins.
#
# Example of how to specify extra plugins in localConfig.rb:
# @extraPlugins = [
#   {:name => 'http', :location => '../cordova-http-digest'},
#   {:name => 'pl.makingwaves.estimotebeacons', :location => '../phonegap-estimotebeacons'},
# ]
#
# Build constants that can be set in localConfig.rb:
# CONFIG_DEFAULT_PLATFORM - Platform to build for
# CONFIG_MOBILE_CHROME_APPS_DIR - Location of Mobile Chrome Apps repository
# CONFIG_BLUETOOTH_SERIAL_DIR - Location of Bluetooth Classic plugin
#
# Example:
# CONFIG_MOBILE_CHROME_APPS_DIR = '../mobile-chrome-apps/chrome-cordova/plugins'
#

require "fileutils"
require 'rexml/document'
require "./utils.rb"
require "./documenter.rb"

include FileUtils::Verbose

@requiredCordovaVersion = "3.6.3"

# Optionally set in localConfig.rb.
@extraPlugins = []	# array of hashes with these keys: {:name, :location}

# List of plugins installed from the local file system
# or from a custom web location.
# This is an array of hashes: {:name=>name, :location=>location}
@localPlugins = []

# Load localConfig.rb, if it exists. This file
# contains configuration settings.
lc = "#{File.dirname(__FILE__)}/localConfig.rb"
require lc if(File.exists?(lc))

# Build command parameters.
# Default platform is Android.
@platform = "android"
@clean = false
@cleanall = false
@install = false
@documentation = false

# local variables
@documentIndex = {}

def testCordovaVersion
	installedVersion = open("|cordova -v").read.strip
	if(installedVersion < @requiredCordovaVersion)
		puts
		puts "Fatal error:"
		if(installedVersion.length < 1)
			puts "Cordova is not properly installed."
		else
			puts "Your installed Cordova version is #{installedVersion}"
		end
		puts "Evothings Studio App requires Cordova #{@requiredCordovaVersion} or later"
		puts
		raise "CordovaVersionError"
	end
end

def parseCommandParameters
	if(defined?(CONFIG_DEFAULT_PLATFORM))
		@platform = CONFIG_DEFAULT_PLATFORM
	end

	ARGV.each do |arg|
		case (arg)
			when "c"
				@clean = true
			when "ca"
				@cleanall = true
			when "i"
				@install = true
			when "doc"
				@documentation = true
			when "android", "wp8", "ios"
				@platform = arg
			else raise "Invalid argument #{arg}"
		end
	end
end

def createDirectories
	mkdir_p "platforms"
	mkdir_p "plugins"
end

def addPlugins
	def addPlugin(name, documenter, location = name, remote = false, branch = false)
		# If a specific location is given, this is considered to be a
		# "local" plugin, which will be scanned for git version info.
		# (location can be a file path or URL).
		if(location != name)
			if(!remote)
				raise "Missing remote for plugin #{name}!"
			end
			@localPlugins << {:name=>name, :location=>location, :remote=>remote}
			if(!File.exist?(location))
				oldDir = pwd
				mkdir_p File.dirname(location)
				cd File.dirname(location)
				postfix = " -b #{branch}" if(branch)
				sh "git clone #{remote}#{postfix}"
				cd oldDir
			end
		end
		# Add plugin if not already installed.
		if(!File.exist?("plugins/#{name}"))
			sh "cordova -d plugin add #{location}"
		end
		if(@documentation && documenter)
			@documentIndex[name] = documenter.run(name, "plugins/#{name}")
		end
	end

	def addMobileChromeAppsPlugin(docUrl, name, location = name)
		if(location != name)
			url = 'https://github.com/MobileChromeApps/' + location
			d = ChromeDocumenter.new(docUrl) if(docUrl)
			if(defined?(CONFIG_MOBILE_CHROME_APPS_DIR))
				# If location and config are specified that is used.
				addPlugin(name, d, CONFIG_MOBILE_CHROME_APPS_DIR + "/" + location, url)
			else
				# If only location is specified use default Chrome Apps plugins directory.
				addPlugin(name, d, "../MobileChromeApps/" + location, url)
			end
		else
			# Use Cordova package name for network install if location is not specified.
			addPlugin(name, d)
		end
	end

	def addApachePlugin(name)
		addPlugin(name, MarkdownDocumenter.new('doc/index.md'))
	end

	@extraPlugins.each do |ep|
		addPlugin(ep[:name], nil, ep[:location])
	end

	# Add standard Cordova plugins.
	addApachePlugin("org.apache.cordova.battery-status")
	addApachePlugin("org.apache.cordova.camera")
	addApachePlugin("org.apache.cordova.console")
	addApachePlugin("org.apache.cordova.device")
	addApachePlugin("org.apache.cordova.device-motion")
	addApachePlugin("org.apache.cordova.device-orientation")
	addApachePlugin("org.apache.cordova.dialogs")
	addApachePlugin("org.apache.cordova.geolocation")
	addApachePlugin("org.apache.cordova.globalization")
	addApachePlugin("org.apache.cordova.inappbrowser")
	addApachePlugin("org.apache.cordova.network-information")
	addApachePlugin("org.apache.cordova.vibration")

	# MobileChromeApps plugins.
	addMobileChromeAppsPlugin(nil, "org.chromium.common", "cordova-plugin-chrome-apps-common")
	addMobileChromeAppsPlugin('https://developer.chrome.com/apps/system_network',
		"org.chromium.system.network", "cordova-plugin-chrome-apps-system-network")
	addMobileChromeAppsPlugin(nil, "org.chromium.iosSocketsCommon", "cordova-plugin-chrome-apps-iosSocketsCommon")
	addMobileChromeAppsPlugin('https://developer.chrome.com/apps/socket',
		"org.chromium.socket", "cordova-plugin-chrome-apps-socket")
	addMobileChromeAppsPlugin('https://developer.chrome.com/apps/sockets_tcp',
		"org.chromium.sockets.tcp", "cordova-plugin-chrome-apps-sockets-tcp")
	#addMobileChromeAppsPlugin('https://developer.chrome.com/apps/sockets_tcpServer',
		#"org.chromium.sockets.tcpserver", "chrome.sockets.tcpServer")	# requires cordova 4.0 on Android.
	addMobileChromeAppsPlugin('https://developer.chrome.com/apps/sockets_udp',
		"org.chromium.sockets.udp", "cordova-plugin-chrome-apps-sockets-udp")

	# Plugins on the local file system.
	addPlugin("com.unarin.cordova.beacon", MarkdownDocumenter.new('README.md'), "../cordova-plugin-ibeacon",
		"https://github.com/evothings/cordova-plugin-ibeacon", "evothings-1.0.0")

	addPlugin("pl.makingwaves.estimotebeacons", MarkdownDocumenter.new('documentation.md'), "../phonegap-estimotebeacons/",
		"https://github.com/evothings/phonegap-estimotebeacons")

	addPlugin("de.appplant.cordova.plugin.local-notification", MarkdownDocumenter.new('README.md'), "../cordova-plugin-local-notifications",
		"https://github.com/evothings/cordova-plugin-local-notifications", "evothings-master")

	# Classic Bluetooth for Android.
	if (@platform == "android")
		if(defined?(CONFIG_BLUETOOTH_SERIAL_DIR))
			location = CONFIG_BLUETOOTH_SERIAL_DIR
		else
			location = "../BluetoothSerial"
		end
		addPlugin("com.megster.cordova.bluetoothserial", MarkdownDocumenter.new('README.md'),
			location, "https://github.com/don/BluetoothSerial")
	end

	addPlugin("com.evothings.ble", JdocDocumenter.new('ble.js'), "../cordova-ble",
		"https://github.com/evothings/cordova-ble")

	# Standard plugins that are not included.
	#addApachePlugin("org.apache.cordova.contacts")
	#addApachePlugin("org.apache.cordova.file")
	#addApachePlugin("org.apache.cordova.file-transfer")
	#addApachePlugin("org.apache.cordova.media")
	#addApachePlugin("org.apache.cordova.media-capture")
	#addApachePlugin("org.apache.cordova.splashscreen")

	# SMS plugin is not included.
	#addPlugin("org.apache.cordova.plugin.sms", MarkdownDocumenter('readme.md'), "../phonegap-sms-plugin")
end

def fileRead(filePath)
	File.open(filePath, "r") { |f|
		s = f.read
		if(RUBY_VERSION >= '1.9')
			return s.force_encoding("UTF-8")
		else
			return s
		end
	}
end

def fileSave(destFile, content)
	File.open(destFile, "w") { |f| f.write(content) }
end

# Read version number from config.xml
def readVersionNumber
	config = fileRead("./config.xml")

	# Get version number from config.xml.
	match = config.scan(/version="(.*?)"/)
	if(match.empty?)
		raise "Version not found in config.xml"
	end

	return match[0][0]
end

# Read the Android version code from config.xml
def readAndroidVersionCode
	config = fileRead("./config.xml")

	# Get version code from config.xml.
	match = config.scan(/android-versionCode="(.*?)"/)
	if(match.empty?)
		raise "Android version code not found in config.xml"
	end

	return match[0][0]
end

def readGitInfo(name, location)
	oldDir = pwd
	cd location
	rp = "git rev-parse HEAD"
	sh rp	# make sure the command doesn't fail; open() doesn't do that.
	hash = open("|#{rp}").read.strip
	ss = "git status -s"
	sh ss
	mod = open("|#{ss}").read.strip
	if(mod != "")
		mod = " modified"
	end
	cd oldDir
	# Git version string contains: name, hash, modified flag
	gitInfo = "#{name}: #{hash[0,8]}#{mod}"
	return gitInfo
end

# Create www/index.html with version into.
# This file is used in the Cordova build process.
def createIndexFileWithVersionInfo
	index = fileRead("config/www/index.html")
	version = readVersionNumber()
	gitInfo = readGitInfo("evothings-studio-app", ".")
	@localPlugins.each do |lp|
		if(lp[:location].start_with?("http://") or lp[:location].start_with?("https://"))
			cmd = "git ls-remote #{lp[:location]} HEAD"
			puts cmd
			hash = open("|#{cmd}").read.strip.split[0]
			gitInfo << "\n<br/>" + "#{lp[:name]}: #{hash[0,8]}"
		else
			gitInfo << "\n<br/>" + readGitInfo(lp[:name], lp[:location])
		end
	end
	versionString = "#{version}<br/>\n<br/>\n#{gitInfo}<br/>\n"
	if(!index.gsub!("__APP_VERSION__", versionString))
		raise "Could not find __APP_VERSION__ in config/www/index.html"
	end
	fileSave("www/index.html", index)
end

# "platforms/android/AndroidManifest.xml"
def modifyManifest
	return if(@platform != "android")

	filename = "platforms/android/AndroidManifest.xml"
	puts "Modifying #{filename}..."
	doc = REXML::Document.new(fileRead(filename))
	doc.elements.each('manifest/application/activity') do |el|
		hasEvothingsFilter = false
		el.elements.each("intent-filter/data[@android:scheme='evothings']") do |e|
			hasEvothingsFilter = true
			puts "evothings filter already present."
		end
		break if(hasEvothingsFilter)

		intentFilter = REXML::Element.new('intent-filter')
		intentFilter.add_element('data', {'android:scheme' => 'evothings'})
		intentFilter.add_element('action', {'android:name' => 'android.intent.action.VIEW'})
		intentFilter.add_element('category', {'android:name' => 'android.intent.category.DEFAULT'})
		intentFilter.add_element('category', {'android:name' => 'android.intent.category.BROWSABLE'})
		el.add_element(intentFilter)
	end
	doc.elements.each('manifest/uses-sdk') do |el|
		ourMinSdkVersion = 14
		if(el.attributes['android:minSdkVersion'].to_i > ourMinSdkVersion)
			raise "Error: android:minSdkVersion > #{ourMinSdkVersion}"
		end
		el.attributes['android:minSdkVersion'] = ourMinSdkVersion
	end
	file = open(filename, "w")
	doc.write(file, 4)
	file.close
	puts "Wrote #{filename}."
end

def copyIconsAndPlatformFiles
	# Copy Android icon files to native project.
	if(@platform == "android")
		androidIcons = {
			"drawable-ldpi" => 36,
			"drawable-mdpi" => 48,
			"drawable-hdpi" => 72,
			"drawable-xhdpi" => 96,
			"drawable" => 96,
		}
		androidIcons.each do |dest,src|
			srcFile = "config/icons/icon-#{src}.png"
			destFile = "platforms/android/res/#{dest}/icon.png"
			# Removed uptodate? check because it fails when existing
			# dest icons are newer than then source icons (which happens
			# when cleaning the project by deleting and adding a platform).
			#if(!uptodate?(destFile, [srcFile]))
				cp(srcFile, destFile)
			#end
		end
	end

	# Copy iOS icon files to native project.
	# For info about iOS app icons, see:
	# https://developer.apple.com/library/ios/documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/App-RelatedResources/App-RelatedResources.html#//apple_ref/doc/uid/TP40007072-CH6-SW1
	if(@platform == "ios")
		srcPath = "config/icons/"
		destPath = "platforms/ios/EvothingsApp/Resources/icons/"

		# Delete old icons.
		rm_rf(Dir.glob(destPath + "*"))

		copyIOSIcon = lambda do |src, dest|
			cp(srcPath + src, destPath + dest)
		end

		copyIOSIcon.call("icon-white-29.png", "icon-small.png")
		copyIOSIcon.call("icon-white-40.png", "icon-40.png")
		copyIOSIcon.call("icon-white-50.png", "icon-50.png")
		copyIOSIcon.call("icon-white-57.png", "icon.png")
		copyIOSIcon.call("icon-white-58.png", "icon-small@2x.png")
		copyIOSIcon.call("icon-white-80.png", "icon-40@2x.png")
		copyIOSIcon.call("icon-white-60.png", "icon-60.png")
		copyIOSIcon.call("icon-white-100.png", "icon-50@2x.png")
		copyIOSIcon.call("icon-white-114.png", "icon@2x.png")
		copyIOSIcon.call("icon-white-120.png", "icon-60@2x.png")
		copyIOSIcon.call("icon-white-72.png", "icon-72.png")
		copyIOSIcon.call("icon-white-76.png", "icon-76.png")
		copyIOSIcon.call("icon-white-144.png", "icon-72@2x.png")
		copyIOSIcon.call("icon-white-152.png", "icon-76@2x.png")
		copyIOSIcon.call("icon-white-180.png", "icon-60@3x.png")
	end

	# Copy iOS splash screens.
	if(@platform == "ios")
		srcPath = "config/icons/ios_splash"
		destPath = "platforms/ios/EvothingsApp/Resources/splash"
		copy_entry(srcPath, destPath)
	end

	# Copy native Android source files.
	if(@platform == "android")
		# Copy customised Activity class.
		cp("config/native/android/src/com/evothings/evothingsstudioapp/MainActivity.java",
			"platforms/android/src/com/evothings/evothingsstudioapp/MainActivity.java")
	end

	# Copy native iOS source files.
	if(@platform == "ios")
		# Copy custom main file.
		cp("config/native/ios/main.m",
			"platforms/ios/EvothingsApp/main.m")

		# Copy customised AppDelegate class.
		cp("config/native/ios/AppDelegate.m",
			"platforms/ios/EvothingsApp/Classes/AppDelegate.m")

		# Insert version number into customised Info-plist.
		fileSave(
			"platforms/ios/EvothingsApp/EvothingsApp-Info.plist",
			fileRead("config/native/ios/EvothingsApp-Info.plist").gsub(
				"EVOTHINGS_STUDIO_APP_VERSION_NUMBER",
				readVersionNumber()))
	end
end

def copyStylesheetAndJQuery
	if(File.exist?("../evothings-examples/resources"))
		cp_r(Dir["../evothings-examples/resources/ui"], "www/")
		cp_r(Dir["../evothings-examples/resources/libs/jquery"], "www/libs/")
		mkdir_p("www/libs/evothings/")
		cp("../evothings-examples/resources/libs/evothings/evothings.js",
			"www/libs/evothings/evothings.js")
		cp_r(Dir["../evothings-examples/resources/libs/evothings/ui"],
			"www/libs/evothings/")
		#cp("../evothings-examples/resources/libs/evothings/ui/ui.js",
		#	"www/libs/evothings/ui/ui.js")
		#cp("../evothings-examples/resources/libs/evothings/ui/fastclick.js",
		#	"www/libs/evothings/ui/fastclick.js")
	else
		raise "Couldn't find ../evothings-examples/resources."
	end
end

def removeUnusedImages
	if(@platform == "android")
		files = Dir['platforms/android/res/**/screen.png']
		rm(files)
	end
end

def buildDocs
	addPlugins
	writeDocumentationIndex
end

def build
	# Get command line parameters.
	parseCommandParameters

	# Check that the Cordova version installed is
	# compatible with build script.
	testCordovaVersion

	# Remove target platform if switch "c" (clean) is given.
	if(@clean)
		sh "cordova -d platform remove #{@platform}"
	end

	# Clean all platforms and plugins if switch "ca" (cleanall) is given.
	if(@cleanall)
		rm_rf("platforms")
		rm_rf("plugins")
		rm_rf("gen-doc")
	end

	# Create directories required for the build.
	createDirectories

	if(@documentation)
		buildDocs
		return
	end

	# Create www/index.html with current version info.
	createIndexFileWithVersionInfo

	# Add target platform if not present.
	if(!File.exist?("platforms/#{@platform}"))
		sh "cordova -d platform add #{@platform}"
	end

	# Copy icon files and native project files.
	copyIconsAndPlatformFiles

	# Copy stylesheet and associated files from evothings-examples.
	copyStylesheetAndJQuery

	# Add all plugins.
	addPlugins

	# Remove unused Images
	removeUnusedImages

	# Recreate www/index.html with plugin version info.
	createIndexFileWithVersionInfo

	# Modify manifest file(s).
	modifyManifest

	# Build platform.
	sh "cordova build #{@platform}"

	# Install debug build if switch "i" is given.
	if(@install && @platform == "android")
		sh "adb install -r platforms/android/ant-build/MainActivity-debug.apk"
	end
end

build
