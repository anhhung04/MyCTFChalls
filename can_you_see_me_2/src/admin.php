<?php
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");

if(isset($_POST["username"]) && isset($_POST["password"])){
    $username = base64_decode($_POST["username"]);
    $password = base64_decode($_POST["password"]);

    if($username == $password){
        echo "Username has to different from password!!!";
    }else if(!strcmp(md5($password), md5($username))){
        $_SESSION["is_admin"] = true;
        echo "Logged in!";
    }
    die(1);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Page</title>
    <!-- Add the Bootstrap CSS link -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css">
</head>
<body>

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header text-center">Login</div>
                <div class="card-body">
                    <form action="/admin.php" method="post">
                            <div class="form-group">
                                <label for="username">Username</label>
                                <input type="text" class="form-control" id="username" name="username"  placeholder="Enter username">
                            </div>
                            <div class="form-group" >
                                <label for="password">Password</label>
                                <input type="password" class="form-control" id="password" name="password" placeholder="Enter password">
                            </div>
                            <input type="submit" class="btn btn-primary btn-block" value="Login"></input>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Add the Bootstrap JS and jQuery scripts at the bottom of your HTML -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.min.js"></script>
</body>
</html>