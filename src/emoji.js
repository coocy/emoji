
var SupportEmoji = false,
	UA = navigator.userAgent;

if (UA.match(/Mac\s+OS/i) && !UA.match(/(Chrome|Firefox)/i)) {
	SupportEmoji = true;
}

var Emoji = {

	reg: /emoji_reg/g,

	emojiPath: 'emoji/',

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
	},

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

	emoji: SupportEmoji ? function() {} : function(text) {
		setTimeout(function() {
			Emoji.trans(text);
		}, 0);
	},

	trans:  function(text) {
		var isElement, el, fontSize;
		if (text.nodeType) {
			el = text;
			fontSize = (el.currentStyle || window.getComputedStyle(el, ''))['fontSize'];

			fontSize = parseFloat(fontSize);
			text = el.innerHTML;
			isElement = true;
		} else {
			fontSize = fontSize || 14;
		}

		fontSize += 4;

		text = text.replace(Emoji.reg, function(code) {
			return '<img width=' + fontSize + ' class="emoji" src="' + Emoji.emojiPath + Emoji._escapeToUtf32(code) + '.png">';
		});

		if (isElement) {
			el.innerHTML = text;
		}
		return text;
	}
};

if (typeof $ !== 'undefined') {
	$.fn.emoji = SupportEmoji ? function() {} :  function() {
		this.each(function(index, element) {
			Emoji.emoji(element);
		});
	};
}
