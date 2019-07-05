#!/usr/bin/env node

var fs = require('fs'),
	os = require('os'),
	child = require('child_process'),
	path = require('path');

var fileName = global.process.mainModule.filename,
	rootPath = path.resolve(path.dirname(fileName) + '/../'),
	platform = os.platform(),
	emojiSourceDir = rootPath + '/emoji-data/img-apple-160/',
	emojiDestDir = rootPath + '/emoji/',
	emojiDestDir2X = rootPath + '/emoji/2x/';
	emojiResizeDir = rootPath + '/_resize/',
	emojiResizeDir2x = rootPath + '/_resize/2x/',
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

// 'あい' => '\u3042\u3044'
var escapeToUtf16 = function(str) {
	var escaped = '';
	for (var i = 0, l = str.length; i < l; i++) {
		var hex = str.charCodeAt(i).toString(16);
		escaped += "\\u" + '0000'.substr(hex.length) + hex;
	}
	return escaped;
};

// '\u{1f595}\u{1f3fb}' => '1f595-1f3fb'
var escapeToUtf32 = function(str) {
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

// Test
// console.log(escapeToUtf16('\u{1f004}'));
// console.log('\u{1f595}\u{1f3fb}');
// console.log(escapeToUtf32('\u{1f595}\u{1f3fb}'));
// return;

var resizeImages = function(fileNames, sourceDir, destDir, size) {

	var fileCount = fileNames.length,
		compressSuccessCount = 0;

	for (var i = 0; i < fileCount; i++) {
		var file = fileNames[i] + '.png',
			cmd = 'convert "' + sourceDir + file + '" -resize ' + size + 'x' + size + ' "' +  destDir + file + '"';

		child.execSync(cmd, {
			env: process.env
		});
		if (fs.existsSync(destDir + file)) {
			compressSuccessCount ++;
		}
	}
	console.log('Resize ' + fileCount + ' images with ' + compressSuccessCount + ' success');
};

// Compress images
var compressImages = function(sourceDir, destDir, callback) {

	fs.readdir(sourceDir, function(err, files) {
		if (err) {
			console.log(err);
		} else {

			var fileCount = files.length,
				compressSuccessCount = 0,
				pngquant = 'pngquant';

			if ('win32' === platform) {
				pngquant = 'pngquant.exe';
			} else if ('darwin' === platform) {
				pngquant = 'pngquant_mac';
			}

			for (var i = 0; i < fileCount; i++) {
				var file = files[i],
					cmd = rootPath + '/bin/' + pngquant + ' --skip-if-larger -f -o ' + destDir + file +
						' --quality=65 -- ' + sourceDir + file;

				if (!file.match(/\.png$/)) {
					continue;
				}

				try {
					child.execSync(cmd, {
						env: process.env
					});
				} catch (e) {}
				if (fs.existsSync(destDir + file)) {
					compressSuccessCount ++;
				} else {
					fs.copyFileSync(sourceDir + file, destDir + file);
				}
			};
			console.log('Compressed ' + fileCount + ' images with ' + compressSuccessCount + ' success');
		}
	});
};

// Read emoji data
fs.readFile(rootPath + '/emoji-data/emoji.json', function(err, data) {

	if (err) {
		console.log(err);
	} else {
		var emojiData = JSON.parse(data.toString());
		var emojiCount = 0;
		var emojis = [];
		var emojiMap = {};
		var fileNames = [];
		var resultEncoded = [];

		var emojiDataExpanded = [];
		for (var i = 0, l = emojiData.length; i < l; i++) {
			var item = emojiData[i];
			if (item['has_img_apple']) {
				if (item['skin_variations']) {
					for (var j in item['skin_variations']) {
						var skinItem = item['skin_variations'][j];
						if (skinItem['has_img_apple']) {
							emojiDataExpanded.push(skinItem['unified']);
						}
					}
				}
				emojiDataExpanded.push(item['unified']);
			}
		}

		for (var i = 0, l = emojiDataExpanded.length; i < l; i++) {
			var unified = emojiDataExpanded[i];
			var unicode = unified.split('-').map(function(char) {
				return "\\u" + char.toLocaleLowerCase();
			}).join('');

			var fileName = unified.split('-').map(function(char) {
				return char.toLocaleLowerCase();
			}).join('-');
			fileNames.push(fileName);

			var emoji = unified.split('-').map(function(char) {
				return '\\u{' + char.toLocaleLowerCase() + '}';
			}).join('');

			eval('var emoji="' + emoji + '"');
			emojis.push(emoji);
			resultEncoded.push(escapeToUtf16(emoji));
			emojiMap[emoji] = fileName + ' | ' + unicode;
			emojiCount++;
		};

		var emojiTexts = emojis.join(' ');
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
		fs.mkdirSync(emojiResizeDir2x);

		// Create the 1x size images
		resizeImages(fileNames, emojiSourceDir, emojiResizeDir, maxEmojiSize);

		// Compress the 1x size images
		compressImages(emojiResizeDir, emojiDestDir);

		// Create the 2x size images
		resizeImages(fileNames, emojiSourceDir, emojiResizeDir2x, maxEmojiSize * 2);

		// Compress the 2x size images
		compressImages(emojiResizeDir2x, emojiDestDir2X);
		
		deleteFolderRecursive(emojiResizeDir);
	}
});