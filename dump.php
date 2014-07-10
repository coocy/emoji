<?php
	header('Content-type: text/html; charset=UTF-8');
?><!DOCTYPE html>
<html>
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8">
	<title>Emoji</title>
	<meta http-equiv="x-ua-compatible" content="ie=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
	<style type="text/css">
		body{
			font-family:Helvetica;
		}
	</style>
</head>
<body>

<?php

function emoji_utf8_bytes($cp){

	if ($cp > 0x10000){
		# 4 bytes
		return	chr(0xF0 | (($cp & 0x1C0000) >> 18)).
			chr(0x80 | (($cp & 0x3F000) >> 12)).
			chr(0x80 | (($cp & 0xFC0) >> 6)).
			chr(0x80 | ($cp & 0x3F));
	}else if ($cp > 0x800){
		# 3 bytes
		return	chr(0xE0 | (($cp & 0xF000) >> 12)).
			chr(0x80 | (($cp & 0xFC0) >> 6)).
			chr(0x80 | ($cp & 0x3F));
	}else if ($cp > 0x80){
		# 2 bytes
		return	chr(0xC0 | (($cp & 0x7C0) >> 6)).
			chr(0x80 | ($cp & 0x3F));
	}else{
		# 1 byte
		return chr($cp);
	}
}

function unicode_to_emoji($cps){
	$out = '';

	foreach ($cps as $cp){
		$out .= emoji_utf8_bytes($cp);
	}

	return $out;
}

function emoji_to_unicodes($txt) {

	//$cps = unpack('V*', iconv('UTF-8', 'UTF-32LE', $txt));
	$codes = unpack('V*', mb_convert_encoding($txt, 'UTF-32LE', 'UTF-8'));

	$out = array();

	foreach ($codes as $code){
		$out []= sprintf('%04x', $code);
	}

	return $out;
}

$emoji_data = file_get_contents('gemoji/db/emoji.json');

$emoji_data = json_decode($emoji_data, true);
$n = 0;

foreach ($emoji_data as $k => $item) {
	if (array_key_exists('emoji', $item)) {
		$emoji = $item['emoji'];
		$emoji_code = join('-', emoji_to_unicodes($emoji));
		$emoji_file = 'emoji/'.$emoji_code.'.png';
		echo $emoji.'('.$emoji_code.'): <img width="24px" height="24px" src="'.$emoji_file.'"> ';
		$n++;
	}
}

//$src_char = emoji_to_unicode_string('🇯🇵'); //\uD83C\uDDEF\uD83C\uDDF5 \U0001F1EF\U0001F1F5
//echo $src_char;
