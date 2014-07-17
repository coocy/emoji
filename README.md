#Emoji.js

使用前端转换方式在不支持emoji表情符号的设备和浏览器中使用图片显示emoji表情符号，转换后的表情符号可以自适应文字大小。

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

## CREDITS

参考了`php-emoji`项目:
https://github.com/iamcal/php-emoji

emoji字典和图片来自`gemoji`项目:
https://github.com/github/gemoji
