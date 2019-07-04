#!/usr/bin/env node

var fs = require('fs'),
	child = require('child_process'),
	path = require('path');

var fileName = global.process.mainModule.filename,
	rootPath = path.resolve(path.dirname(fileName) + '/../'),
	emojiSourceDir = rootPath + '/emoji-data/img-apple-160/',
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

function unicode(str){
    str = str.replace(/\ufe0f|\u200d/gm, ''); // strips unicode variation selector and zero-width joiner
    var i = 0, c = 0, p = 0, r = [];
    while (i < str.length){
        c = str.charCodeAt(i++);
        if (p){
            r.push((65536+(p-55296<<10)+(c-56320)).toString(16));
            p = 0;
        } else if (55296 <= c && c <= 56319){
            p = c;
        } else {
            r.push(c.toString(16));
        }
    }
    return r.join('-');
}
//console.log("\u{1f004}");return;

// Read emoji data
fs.readFile(rootPath + '/emoji-data/emoji.json', function(err, data) {

	if (err) {
		console.log(err);
	} else {
		var emojiData = JSON.parse(data.toString());
		var emojiCount = 0;
		var result = [];
		var resultEncoded = [];

		for (var i = 0, l = emojiData.length; i < l; i++) {
			var item = emojiData[i];
			if (item['has_img_apple']) {
				var unicode = item['unified'].split('-').map(function(char) {
					return "\\u" + char.toLocaleLowerCase();
				}).join('');
				resultEncoded.push(unicode);

				var emoji = item['unified'].split('-').map(function(char) {
					return '\\u{' + char.toLocaleLowerCase() + '}';
				}).join('');

				eval('var emoji="' + emoji + '"');
				result.push(emoji);
				emojiCount++;
			}
		};

		var emojiTexts = result.join(' ');
		var emojiReg = '/' + resultEncoded.join('|') + '/';

		// Write js
		fs.readFile(rootPath + '/src/emoji.js', function(err, data) {
			if (err) {
				console.log(err);
			} else {
				var jsContents = data.toString().replace('/emoji_reg/', emojiReg).replace('\'@maxSize\'', maxEmojiSize);
				fs.writeFile(rootPath + '/emoji.js', jsContents, function(err) {
					if (err) {
						console.log(err);
					}
					console.log('Save emoji.js success.');
				});
			}
		});

		// Write test html
		fs.readFile(rootPath + '/src/index.html', function(err, data) {
			if (err) {
				console.log(err);
			} else {
				var htmlContents = data.toString()
					.replace(/\{emoji\}/g, emojiTexts)
					.replace(/\{emoji_count\}/g, emojiCount);

				fs.writeFile(rootPath + '/index.html', htmlContents, function(err) {
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
		resizeImages(emojiSourceDir, emojiResizeDir, maxEmojiSize, function() {

			// Compress the 1x size images
			compressImages(emojiResizeDir, emojiDestDir, function() {

				// Create the 2x size images
				resizeImages(emojiSourceDir, emojiResizeDir, maxEmojiSize * 2, function() {

					// Compress the 2x size images
					compressImages(emojiResizeDir, emojiDestDir2X, function() {
						deleteFolderRecursive(emojiResizeDir);
					});
				});
			});
		});
	}
});