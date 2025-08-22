<?php
declare(strict_types=1);

// ugyanaz a környezet, mint a példádban
require_once('../common/php/environment.php');

// engedélyezett mappák: media/image/projects/<DIR>
$allowed = [
  'kulteri_korlatok',
  'acel_szerkezetek_feltetok',
  'gokart_alvazak_ulesek',
  'egyedi_megrendelesek',
  'kerekpar_tarolok'
];

$dir = $_GET['dir'] ?? '';
if (!in_array($dir, $allowed, true)) {
  Util::setError('invalid dir');
}

// képek kiglobolása és rendezése (basename-eket adunk vissza)
$pattern = "./media/image/our_jobs/{$dir}/*.{jpg,jpeg,png,gif,webp,avif}";
$result  = glob($pattern, GLOB_BRACE) ?: [];
$result  = array_map('basename', $result);
natcasesort($result);
$result  = array_values($result);

// válasz
Util::setResponse($result);