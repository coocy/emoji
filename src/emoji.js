
var Emoji = {

	reg: /emoji_reg/g,

	emojiPath: 'emoji/',

	//表情图片的最大尺寸
	maxSize: '@maxSize',

	emoji: function(text) {

		//在第一次调用的时候检查浏览器是否支持emoji符号
		var supportEmoji = false,
			UA = navigator.userAgent;

		if (UA.match(/Mac\s+OS/i) && !UA.match(/(Chrome|Firefox)/i)) {
			supportEmoji = true;
		}

		//如果浏览器支持原生的emoji，无需转换，把转换方法置空
		if (supportEmoji) {
			Emoji.emoji = function() {};

			//置空$().emoji()方法
			if (typeof $ !== 'undefined') {
				$.fn.emoji = function() {};
				return false; //return false是为了终止$().each()循环
			}
		} else {

			//判断屏幕分辨率，如果是高清屏的话使用稍大尺寸的表情图片
			var pixelRatio = parseFloat(window.devicePixelRatio) || 1;
			if (pixelRatio > 1.2) {
				Emoji.emojiPath += '2x/';
			}

			Emoji.emoji = function(text) {
				setTimeout(function() {
					Emoji.trans(text);
				}, 0);
			}

			Emoji.emoji(text);
		}
	},

	trans:  function(text) {
		var isElement, el, fontSize;
		if (text.nodeType) {
			el = text;
			fontSize = (el.currentStyle || window.getComputedStyle(el, ''))['fontSize'];

			//IE浏览器下如果css中的font-size单位不是象素的话，需要转换一下
			if (!/px$/i.test(fontSize)) {
				var left = el.style.left;
					el.style.left = '1em';

				fontSize = el.style.pixelLeft;
				el.style.left = left;
			}

			fontSize = parseFloat(fontSize);
			text = el.innerHTML;
			isElement = true;
		} else {
			fontSize = fontSize || 14;
		}

		fontSize += 4;
		fontSize = Math.min(fontSize, Emoji.maxSize);

		text = text.replace(Emoji.reg, function(code) {
			return '<img width=' + fontSize + ' class="emoji" style="vertical-align:middle" src="' + Emoji.emojiPath + Emoji._escapeToUtf32(code) + '.png">';
		});

		if (isElement) {
			el.innerHTML = text;
		}
		return text;
	},

	//编码转换
	_escapeToUtf32: function(str) {
		var escaped = [],
			unicodeCodes = Emoji._convertStringToUnicodeCodePoints(str),
			i = 0,
			l = unicodeCodes.length,
			hex;

		for (; i < l; i++) {
			hex = unicodeCodes[i].toString(16);
			escaped.push('0000'.substr(hex.length) + hex);
		}
		return escaped.join('-');
	},

	_convertStringToUnicodeCodePoints: function(str) {
		var surrogate1st = 0,
			unicodeCodes = [],
			i = 0,
			l = str.length;

		for (; i < l; i++) {
			var utf16Code = str.charCodeAt(i);
			if (surrogate1st != 0) {
				if (utf16Code >= 0xDC00 && utf16Code <= 0xDFFF) {
					var surrogate2nd = utf16Code,
						unicodeCode = (surrogate1st - 0xD800) * (1 << 10) + (1 << 16) + (surrogate2nd - 0xDC00);
					unicodeCodes.push(unicodeCode);
				}
				surrogate1st = 0;
			} else if (utf16Code >= 0xD800 && utf16Code <= 0xDBFF) {
				surrogate1st = utf16Code;
			} else {
				unicodeCodes.push(utf16Code);
			}
		}
		return unicodeCodes;
	}
};

if (typeof $ !== 'undefined') {
	$.fn.emoji = function() {
		this.each(function(index, element) {
			Emoji.emoji(element);
		});
	};
}
