

var fs = require('fs'),
	child = require('child_process'),
	path = require('path');

deleteFolderRecursive = function(path) {
	var files = [];
	if (fs.existsSync(path)) {
		files = fs.readdirSync(path);
		files.forEach(function(file,index) {
			var curPath = path + "/" + file;
			if (fs.lstatSync(curPath).isDirectory()) {
				deleteFolderRecursive(curPath);
			} else {
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

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

		//compress images
		var rootPath = path.resolve('../');
		var sourceDir = '../gemoji/images/emoji/unicode';
		fs.readdir(sourceDir, function(err, files) {
			if (err) {
				console.log(err);
			} else {
				for (var i = 0, l = files.length; i < l; i++) {
					var file = files[i];

					var cmd = rootPath + '/bin/pngquant.exe -f -o ' + rootPath +'/emoji/' + file +
						' --speed=1 --quality=35-90 -- ' + sourceDir + '/' + file;

					child.exec(cmd, function (err, stdout, stderr) {
						if (err) {
							console.log(err);
						} else {
							console.log('Compress image ' + file + ' success');
						}
					});
				};

				var j = 8,
					x = 0,
					tempDir = '/_emoji/',
					inDir, outDir;

				if (!fs.existsSync(rootPath + tempDir)) {
					fs.mkdirSync(rootPath + tempDir);
				}

				while(j--) {

					if (0 === x) {
						inDir = '/emoji/',
						outDir = tempDir;
						x = 1;
					} else {
						inDir = '/_emoji/',
						outDir = tempDir;
						x = 0;
					}

					for (var i = 0, l = files.length; i < l; i++) {
						var file = files[i];

						var cmd = rootPath + '/bin/pngquant.exe -f -o ' + rootPath + outDir  + file +
							' --speed=1 --quality=50-90 -- ' + rootPath + inDir + file;

						child.exec(cmd, function (err, stdout, stderr) {
							if (err) {
								console.log(err);
							} else {
								console.log('Compress image ' + file + ' success');
							}
						});
					};
				}

				deleteFolderRecursive(rootPath + tempDir);
			}
		});
	}
});