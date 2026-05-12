<?php

declare(strict_types=1);

$loader = require __DIR__ . '/../../../../vendor/autoload.php';
$loader->addPsr4('App\\', __DIR__ . '/../src/', true);
$loader->addPsr4('Tests\\', __DIR__ . '/', true);
