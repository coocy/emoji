#Emoji.js

使用前端转换方式在不支持emoji表情符号的设备和浏览器中使用图片显示emoji表情符号，转换后的表情符号可以自适应文字大小（最大不超过20px，如果需要自定义的图片尺寸，请参见'重新生成代码和表情图片'）。

每个emoji表情符号会被替换成对应的表情图片，在正常分辨率屏幕的设备上加载的图片尺寸为20×20，在高清屏上加载的图片尺寸为40×40。

**为什么不使用CSS Sprites?**
```
使用CSS Sprites虽然会减少请求数量，但是合并后图片过大，并且需要额外的css文件来定义sprites，
在大部分使用场景下，如果文本中的emoji数量有限的话使用单张图片替换是更好的方案。
```

Demo:
http://coocy.github.io/emoji

## 安装:

拷贝`emoji.js`和`emoji`文件夹到你的项目中。

## 使用: 

```html
<html>
<head>
    <title>Title</title>
    <script type="text/javascript" src="emoji.js"></script>
</head>
<body>
    <div id="text">...</div>
    <script type="text/javascript">
        //转换包含emoji文本内容的DOM对象
        var el = document.getElementById('text');
        html = Emoji.emoji(el);
    </script>
</body>
</html>
```

如果页面使用了[jQuery](https://github.com/jquery/jquery)或者[Zepto](https://github.com/madrobby/zepto)，可以这样调用:
```javascript
$('#text').emoji();
```

## 重新生成代码和表情图片

需要安装[Node.js](http://nodejs.org/)和[ImageMagick](http://www.imagemagick.org/)

输出脚本`output.js`放在`src`文件夹中，
重新输出：

```
node src/output.js
```

`output.js`会执行以下动作：
1. 从原始的emoji字典文件生成emoji.js中的替换正则表达式
2. 生成index.html中的字符列表
3. 使用原始emoji图片生成压缩后的图片，包括1x和2x两种尺寸

如果需要调整生成的emoji图片大小，修改`output.js`中的`maxEmojiSize`变量值，然后执行输出脚本

## CREDITS

参考了`php-emoji`项目:
https://github.com/iamcal/php-emoji

emoji字典和图片来自`gemoji`项目:
https://github.com/github/gemoji
