<?php
header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");
include_once 'common.php';
include_once 'authChk.php';

responseApi(200, 'SUCCESS', null);
?>