

var fs = require('fs'),
	child = require('child_process'),
	path = require('path');

var rootPath = path.resolve('../'),
	emojiSourceDir = rootPath + '/gemoji/images/emoji/unicode/',
	emojiDestDir = rootPath + '/emoji/',
	emojiDestDir2X = rootPath + '/emoji/2x/';
	emojiResizeDir = rootPath + '/_resize/',
	maxEmojiSize = 20; // Max size of emoji images


var deleteFolderRecursive = function(path) {
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
var escapeToUtf16 = function(str) {
	var escaped = '';
	for (var i = 0, l = str.length; i < l; i++) {
		var hex = str.charCodeAt(i).toString(16);
		escaped += "\\u" + '0000'.substr(hex.length) + hex;
	}
	return escaped;
};

var resizeImages = function(sourceDir, destDir, size, callback) {

	fs.readdir(sourceDir, function(err, files) {
		if (err) {
			console.log(err);
		} else {

			var fileCount = files.length,
				compressedCount = 0,
				compressSuccessCount = 0;

			for (var i = 0; i < fileCount; i++) {
				var file = files[i],
					cmd = 'convert "' + sourceDir + file + '" -resize ' + size + 'x' + size + ' "' +  destDir + file + '"';

				child.exec(cmd, {
					env: process.env
				}, function (err, stdout, stderr) {
					compressedCount++;
					if (err) {
						console.log(err);
					} else {
						compressSuccessCount++;
					}

					// Run callback function after all images are resized
					if (compressedCount === fileCount) {
						console.log('Resized ' + compressedCount + ' images with ' + compressSuccessCount + ' success');
						if (callback) {
							callback();
						}
					}
				}.bind(file));
			};
		}
	});
};

// Compress images
var compressImages = function(sourceDir, destDir, callback) {

	fs.readdir(sourceDir, function(err, files) {
		if (err) {
			console.log(err);
		} else {

			var fileCount = files.length,
				compressedCount = 0,
				compressSuccessCount = 0;

			for (var i = 0; i < fileCount; i++) {
				var file = files[i],
					cmd = rootPath + '/bin/pngquant.exe -f -o ' + destDir + file +
						' --quality=65 -- ' + sourceDir + '/' + file;

				child.exec(cmd, {
					env: process.env
				}, function (err, stdout, stderr) {
					compressedCount++;
					if (err) {
						console.log(err);
					} else {
						compressSuccessCount++;
					}

					// Run callback function after all images are compressed
					if (compressedCount === fileCount) {
						console.log('Compressed ' + compressedCount + ' images with ' + compressSuccessCount + ' success');
						if (callback) {
							callback();
						}
					}
				}.bind(file));
			};
		}
	});
};

// Read emoji data
fs.readFile(rootPath + '/gemoji/db/emoji.json', function(err, data) {

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

		// Write js
		fs.readFile('emoji.js', function(err, data) {
			if (err) {
				console.log(err);
			} else {
				var jsContents = data.toString().replace('/emoji_reg/', emojiReg).replace('\'@maxSize\'', maxEmojiSize);
				fs.writeFile('../emoji.js', jsContents, function(err) {
					if (err) {
						console.log(err);
					}
					console.log('Save emoji.js success.');
				});
			}
		});

		// Write test html
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

		// Compress images
		if (fs.existsSync(emojiDestDir)) {
			deleteFolderRecursive(emojiDestDir);
		}
		fs.mkdirSync(emojiDestDir);
		fs.mkdirSync(emojiDestDir2X);

		if (fs.existsSync(emojiResizeDir)) {
			deleteFolderRecursive(emojiResizeDir);
		}
		fs.mkdirSync(emojiResizeDir);

		// Create the 1x size images
		resizeImages(emojiSourceDir, emojiResizeDir, maxSize, function() {

			// Compress the 1x size images
			compressImages(emojiResizeDir, emojiDestDir, function() {

				// Create the 2x size images
				resizeImages(emojiSourceDir, emojiResizeDir, maxSize * 2, function() {

					// Compress the 2x size images
					compressImages(emojiResizeDir, emojiDestDir2X, function() {
						deleteFolderRecursive(emojiResizeDir);
					});
				});
			});
		});
	}
});