const express = require('express');
const path = require('path');
const session = require('express-session');
const redis = require('redis');
const RedisStore = require("connect-redis").default;
const Database = require('./database');
const uuid = require("crypto").randomUUID();
require("dotenv").config();

const app = express();
const ws = require("express-ws")(app);

const db = new Database(process.env.DB_FILE || path.join(__dirname, '/../database.db'));

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

let redisStore = new RedisStore({
    client: redisClient,
    prefix: "Auction:",
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.COOKIE_SECRET || 'SuperSecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60,
        sameSite: true,
        httpOnly: true,
    },
    store: redisStore
}));

redisClient.on('error', err => console.log('Redis Client Error', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/static', express.static(path.join(__dirname, 'static')));

const limiter = function(req,res,next){
    if(req.session){
        let startTime = req.session.startTime || 0;
        let interval = Date.now() - startTime;
        if(req.session.count && interval < 60*1000){
            req.session.count++;
        }else{
            req.session.count = 1;
            req.session.startTime = Date.now();
        }
        if(req.session.count > 10){
            return res.status(429).json({
                message: "Too many requests"
            });
        }
    }
    next();
}

app.use((req, res, next) => {
    req.id = req?.session?.user_id;
    next();
});

function checkAuth(req, res, next) {
    if (!req.id) {
        return res.redirect("/");
    }
    next();
}


function confirmRequest(req,res,next){
    let realConfirmToken = req.session.confirmToken;
    delete req.session.confirmToken;
    let confirmToken = req.get("X-Confirm-Token") || "default";
    if(confirmToken !== realConfirmToken){
        return res.status(403).json({
            message: "Invalid confirm token"
        });
    }
    let nowTime = Math.floor(Date.now() / 100);
    let confirmTokenTime = parseInt(realConfirmToken.split("_")[1]);
    console.log(nowTime - confirmTokenTime)
    if(nowTime - confirmTokenTime > 50){
        return res.status(403).json({
            message: "Confirm token expired"
        });
    }
    next();
}

app.get("/auction", limiter, checkAuth, (req, res)=>{
    req.session.confirmToken = `${req.id}_${Math.floor(Date.now() / 100)}_${uuid}`
    return res.status(200).json({
        confirmToken: req.session.confirmToken
    })
})

app.post("/auction", limiter, checkAuth, confirmRequest, (req, res) => {
    let { add_value } = req.body;
    add_value = parseInt(add_value);
    if (!Number.isInteger(add_value)) {
        return res.status(400).json({
            message: "Invalid value"
        });
    }
    add_value = Math.abs(add_value);

    return db.getUserById(req.id).then(user => {
        if(!user) return res.status(400).json({
            message: "User not found"
        });
        return db.getLastSession().then(session => {
            return db.getBid(req.id, session.id).then(bidRecord => {
                if (bidRecord) {
                    let bid = bidRecord.bid + add_value;
                    if (bid <= user.balance) {
                        return db.addBid(user.id, session.id, add_value).then(() => {
                            return db.getBid(user.id, session.id).then(bidRecord2 => {
                                if (bidRecord2.bid >= session.max_bid) {
                                    return db.setMaxBid(session.id, bidRecord2.bid, user.id).then(() => {
                                        return res.status(200).json({
                                            bid: bidRecord2.bid,
                                            max: true
                                        });
                                    });
                                }
                                return res.status(200).json({
                                    bid: bidRecord2.bid
                                });
                            });
                        });
                    }
                    return res.status(400).json({
                        message: "You don't have enough money"
                    });
                }
                return res.status(400).json({
                    message: "Please refresh page to join session"
                });
            });
        });
    }).catch(err => {
        return res.status(500).json({
            message: "Internal server error"
        });
    });
});


app.get("/buy_flag", limiter, checkAuth, async (req, res) => {
    let session = await db.getLastSession();
    if (!session) {
        return res.redirect("/");
    }
    if (req.id == session.user_win) {
        return res.status(200).json({
            flag: process.env.FLAG || "BKISC{fake_flag}"
        });
    }
    return res.status(200).json({
        message: "You are not the winner!!!"
    });
});


app.get("/dashboard", limiter, checkAuth, async (req, res) => {
    let session = await db.getLastSession();
    if (!session) {
        session = await db.createNewSession();
    }
    let user = await db.getUserById(req.id);
    let bidRecord = await db.getBid(req.id, session.id);
    if (!bidRecord) {
        await db.createBid(req.id, session.id);
        bidRecord = await db.getBid(req.id, session.id);
    }

    return res.render("dashboard", {
        user: {
            username: user.username,
            bid: bidRecord.bid
        },
        current_price: session.max_bid
    });
});

app.post("/register", limiter , async (req, res) => {
    let { username, password } = req.body;
    let user = await db.getUser(username);
    if (user) {
        return res.status(400).json({
            message: "Username existed"
        });
    }
    user = await db.createUser(username, password);
    return res.redirect("/login");
});

app.post("/login", limiter, async (req, res) => {
    let { username, password } = req.body;
    let user = await db.getUser(username);

    if (!user || user.password != password) {
        return res.redirect("/register");
    }
    req.session.user_id = user.id;
    return res.redirect("/dashboard");
});

app.get("/logout", async (req, res) => {
    req.session.destroy();
    return res.redirect("/");
});

app.ws('/', (s, req) => {
    if (!req.id) {
        return s.close();
    }
    s.on("message", function (msg) {
        let data = JSON.parse(msg);
        ws.getWss().clients.forEach(function (c) {
            c.send(JSON.stringify(data));
        });
    }, function (err) {
        console.log(err);
    });
});

app.use((req, res, next) => {
    if (req.id) {
        return res.redirect("/dashboard");
    }
    next();
});

app.get("/", (req, res) => {
    return res.render('index');
});

app.get("/:page", (req, res, next) => {
    if (!["index", "login", "register"].includes(req.params.page)) {
        return next();
    }
    return res.render(req.params.page);
});

app.all('*', (req, res) => {
    return res.status(404).send({
        message: '404 page not found'
    });
});

app.use((err, req, res, next) => {
    console.log(err);
    return res.status(500).send({
        message: '500 internal server error'
    });
});

module.exports = {
    app,
    db,
    redisClient
};