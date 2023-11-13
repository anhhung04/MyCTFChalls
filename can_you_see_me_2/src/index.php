<?php

error_reporting(0);

header('Content-Type: text/html; charset=utf-8');
session_start();

if(isset($_GET["page"])){
    $page = $_GET["page"];
}else{
    $page = "home.php";
}

if(!in_array($page, ["phpinfo.php","home.php"]) && !$_SESSION["is_admin"]){
    echo "Hackiiiiiing!";
}else{
    $file = "pages/".$page;

    if(file_exists($file)){
        include($file);
    }
}
?>