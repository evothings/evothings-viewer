// OS detection.
;window.hyper = (function(hyper)
{
	hyper.isIOS7 = function()
	{
		return navigator.userAgent.match(/CPU iPhone OS 7/) ||
			navigator.userAgent.match(/CPU iPad OS 7/) ||
			navigator.userAgent.match(/CPU iPod OS 7/) ||
			navigator.userAgent.match(/iPhone; CPU OS 7/) ||
			navigator.userAgent.match(/iPad; CPU OS 7/) ||
			navigator.userAgent.match(/iPod; CPU OS 7/)
	}

	hyper.isIOS = function()
	{
		return navigator.userAgent.match(/iPhone/) ||
			navigator.userAgent.match(/iPad/) ||
			navigator.userAgent.match(/iPod/)
	}

	hyper.isAndroid = function()
	{
		return navigator.userAgent.match(/Android/) ||
			navigator.userAgent.match(/android/)
	}

	hyper.isWP = function()
	{
		return navigator.userAgent.match(/Windows Phone/)
	}

	return hyper
})(window.hyper || {});
