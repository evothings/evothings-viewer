require 'redcarpet'
require 'net/http'
require 'uri'
require 'net/https'

ChromeIndex = []

def writeList(file)
	@documentIndex.each do |name, path|
		file.puts "\t<a href=\"#{path}\" target=\"_blank\">#{name}</a><br />"
	end
end

def writeDocumentationIndex
	# download chrome docs, all at the same time.
	cd 'gen-doc'
	open('chrome.urls', 'wb') do |file|
		ChromeIndex.each do |url|
			file.puts url
		end
	end
	sh('wget --no-check-certificate -p -nc -k -i chrome.urls')
	#rm('chrome.urls')
	ChromeIndex.each do |url|
		uri = URI(url)
		base = uri.host+uri.path
		html = base+'.html'
		#rm_f(html)
		#mv(base, html)
	end
	cd '..'

	# generate index.
	open('gen-doc/index.html', 'wb') do |file|
		file.puts '<html>'
		file.puts '<head>'
		file.puts "\t<title>Evothings Studio App plugin reference index</title>"
		file.puts '</head>'
		file.puts '<body>'
		writeList(file)
		file.puts '</body>'
		file.puts '</html>'
	end

	# generate embeddable index.
	open('gen-doc/index.html.embed', 'wb') do |file|
		writeList(file)
	end
end

class JdocDocumenter
	def initialize(jsFilename)
		@jsFilename = jsFilename
	end
	@@versionOk = false
	def self.checkVersion
		return if(@@versionOk)
		open('|jsdoc -v') do |stream|
			ver = stream.read.strip.split(' ')[1]
			req = '3.2.2'
			if(ver == req)
				@@versionOk = true
				return
			end
			if(!ver || ver == '')
				puts "jsdoc not found. version #{req} is required."
			else
				puts "jsdoc version #{req} is required. installed version: #{ver}"
			end
			raise "jsdoc version error"
		end
	end
	def run(name, location)
		#JdocDocumenter.checkVersion
		cwd = pwd
		cd location
		sh "jsdoc -l -c conf.json #{@jsFilename}"
		cd cwd
		dst = "gen-doc/#{name}"
		rm_rf(dst)
		mkdir_p(File.dirname(dst))
		mv("#{location}/out", dst)
		return name+'/index.html'
	end
end

def downloadTo(srcUri, dstPath)
	puts "Downloading #{srcUri} to '#{dstPath}'..."
	if(srcUri.scheme == 'https')
		http = Net::HTTP.new(srcUri.host, srcUri.port)
		http.use_ssl = true
		http.verify_mode = OpenSSL::SSL::VERIFY_NONE
		res = http.get(srcUri.path)
	else
		res = Net::HTTP.get_response(srcUri)
	end
	if(!res.is_a?(Net::HTTPSuccess))
		throw "Failed to download file!"
	end
	open(dstPath, 'wb') do |file|
		file.write res.body
	end
end

class ChromeDocumenter
	def initialize(docUrl)
		@docUrl = docUrl
	end
	def run(name, location)
		uri = URI(@docUrl)
		dstFilename = "#{uri.host}#{uri.path}"#.html"
		ChromeIndex << @docUrl
		# the stuff will be downloaded later, in writeDocumentationIndex.
		return dstFilename
	end
end

class RenderMarkdownWithDownloadedImages < Redcarpet::Render::HTML
	def self.setDstDir(dstDir)
		@@dstDir = dstDir
	end
  def image(link, title, alt_text)
    uri = URI(link)
		filename = File.basename(uri.path)
		dst = "#{@@dstDir}/#{filename}"
		downloadTo(uri, dst)

		# html spec demands that 'alt' be present.
		alt_text = filename if(!alt_text || alt_text.length == 0)

		# title is optional.
		titleTag = ''
		titleTag = " title=\"#{title}\"" if(title && title.length > 0)

		return "<img src=\"#{filename}\"#{titleTag} alt=\"#{alt_text}\" />"
  end
end

class MarkdownDocumenter
	def initialize(mdFilename)
		@mdFilename = mdFilename
	end
	def run(name, location)
		dstDir = "gen-doc/#{name}"
		mkdir_p(dstDir)
		dst = "#{dstDir}/index.html"
		RenderMarkdownWithDownloadedImages.setDstDir(dstDir)
		markdown = Redcarpet::Markdown.new(RenderMarkdownWithDownloadedImages,
			no_intra_emphasis: true,
			tables: true,
			fenced_code_blocks: true,
			autolink: true,
			strikethrough: true,
			lax_spacing: true,
			space_after_headers: true,
			superscript: true,
			underline: true,
			highlight: true,
			quote: true,
			footnotes: true,
		)
		md = ''
		open("#{location}/#{@mdFilename}") do |file|
			md = file.read
		end
		htmlBody = markdown.render(md)
		open(dst, 'wb') do |file|
			file.puts '<html>'
			file.puts '<head>'
			file.puts "\t<title>#{name}</title>"
			file.puts '</head>'
			file.puts '<body>'
			file.puts htmlBody
			file.puts '</body>'
			file.puts '</html>'
		end
		return name+'/index.html'
	end
end
