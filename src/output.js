

var fs = require('fs');

// 'あい' => r'\u3042\u3044'
function escapeToUtf16(str) {
	var escaped = '';
	for (var i = 0, l = str.length; i < l; i++) {
		var hex = str.charCodeAt(i).toString(16);
		escaped += "\\u" + '0000'.substr(hex.length) + hex;
	}
	return escaped;
}

fs.readFile('../gemoji/db/emoji.json', function(err, data) {
	if (err) {
		console.log(err);
	} else {
		var emojiData = JSON.parse(data.toString());
		var emojiCount = 0;
		var result = [];
		var resultEncoded = [];

		for (var i = 0, l = emojiData.length; i < l; i++) {
			var item = emojiData[i];
			if ('emoji' in item) {
				var emoji = item['emoji'];
				result.push(emoji);
				resultEncoded.push(escapeToUtf16(emoji));
				emojiCount++;
			}
		};

		var emojiTexts = result.join(' ');
		var emojiReg = '/' + resultEncoded.join('|') + '/';

		//write js
		fs.readFile('emoji.js', function(err, data) {
			if (err) {
				console.log(err);
			} else {
				var jsContents = data.toString().replace('/emoji_reg/', emojiReg);
				fs.writeFile('../emoji.js', jsContents, function(err) {
					if (err) {
						console.log(err);
					}
					console.log('Save emoji.js success.');
				});
			}
		});

		//write test html
		fs.readFile('index.html', function(err, data) {
			if (err) {
				console.log(err);
			} else {
				var htmlContents = data.toString()
					.replace(/\{emoji\}/g, emojiTexts)
					.replace(/\{emoji_count\}/g, emojiCount);

				fs.writeFile('../index.html', htmlContents, function(err) {
					if (err) {
						console.log(err);
					}
					console.log('Save index.html success.');
				});
			}
		});

	}
});