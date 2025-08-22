<?php
declare(strict_types=1);

// Set environment
require_once('../common/php/environment.php');

// Gyűjtés + csak fájlnév (basename), majd keverés
$files = glob('./media/image/main_carousel/*.{jpg,jpeg,png,gif,webp,avif}', GLOB_BRACE);

$files = is_array($files) ? array_map('basename', $files) : [];

if (!empty($files)) shuffle($files);

// Válasz
Util::setResponse(['gallery' => $files]);