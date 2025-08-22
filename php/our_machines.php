<?php
declare(strict_types=1);

// Set environment
require_once('../common/php/environment.php');

// Mappa a képekhez
$dir = './media/image/our_machines';

// Képek összegyűjtése (csak fájlnév)
$files = glob($dir . '/*.{jpg,jpeg,png,gif,webp,avif}', GLOB_BRACE);

$files = is_array($files) ? array_map('basename', $files) : [];

// Random sorrend
if (!empty($files)) shuffle($files);

// Válasz
Util::setResponse(['gallery' => $files]);