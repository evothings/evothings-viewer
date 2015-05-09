// Insert meta viewport tag.
(function(hyper)
{
	if (hyper.isIOS())
	{
		// WARNING: For iOS 7, remove the width=device-width and
		// height=device-height attributes.
		// See https://issues.apache.org/jira/browse/CB-4323
		document.write(
			'<meta name="viewport" content="user-scalable=no,' +
			'initial-scale=1, maximum-scale=1, minimum-scale=1,' +
			'target-densitydpi=device-dpi"/>')
	}
	else // Android
	{
		document.write(
			'<meta name="viewport" content="user-scalable=no,' +
			'initial-scale=1, maximum-scale=1, minimum-scale=1,' +
			'width=device-width,height=device-height"/>')
	}
})(window.hyper || {});
