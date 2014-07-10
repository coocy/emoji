<?php

function emoji_to_unicodes($txt) {

	$codes = unpack('V*', mb_convert_encoding($txt, 'UTF-32LE', 'UTF-8'));

	$out = array();

	foreach ($codes as $code){
		$out []= sprintf('%04x', $code);
	}

	return $out;
}

$emoji_data = file_get_contents('gemoji/db/emoji.json');
$emoji_data = json_decode($emoji_data, true);

$count = 0;

$emoji_reg_array = array();
$emoji_data_array = array();

foreach ($emoji_data as $k => $item) {
	if (array_key_exists('emoji', $item)) {
		$emoji = $item['emoji'];
		$count++;

		$emoji_reg_array[] = str_replace('"', '', json_encode($emoji));
		$emoji_data_array[] = json_encode($emoji);
	}
}

$emoji_reg = '/'.join('|', $emoji_reg_array).'/g';
$emoji_data = '['.join(',', $emoji_data_array).']';

$js = file_get_contents('emoji_template.js');
$js = str_replace(
		array('/emoji_reg/', "['emoji_data']"),
		array($emoji_reg, $emoji_data), $js
	);


if ($handle = fopen('emoji.js', 'w')) {
     fwrite($handle, $js);
}

echo "Output Success: count: $count\r\n";


