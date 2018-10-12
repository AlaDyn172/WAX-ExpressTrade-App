var express = require('express');
var passport = require('passport');
var CustomStrategy = require('passport-custom');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var opAuth = require('opskins-oauth');
var request = require('request');
var mysql = require('mysql');
var db_config = {
    host: "localhost",
    user: "root",
    password: "wax_internet",
    database: "wax_db"
};
var pool;
var app = express();

database_connection();

app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    res.render('pages/index');
});

let sessionMiddleware = session({
    key: 'session_id',
    secret: 'aladyn17200777',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365
    }
});

app.use(cookieParser());
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

let OpskinsAuth = new opAuth.init({
    name: 'Echo Services WAXApp',
    returnURL: 'http://104.248.132.203/auth/opskins/authenticate',
    apiKey: '53e2150d0d8ca2273a892915fe145f',
    scopes: 'identity trades items manage_items',
    mobile: true
});


passport.use('custom', new CustomStrategy(function (req, done) {
    OpskinsAuth.authenticate(req, (err, user) => {
        if (err) {
            done(err);
        } else {
            done(null, user);
        }
    });
}));

// LOGIN BY OPSKINS
    app.get('/auth/opskins', function (req, res) {
        res.redirect(OpskinsAuth.getFetchUrl());
    });

    app.get('/auth/opskins/authenticate', passport.authenticate('custom', {
        failureRedirect: '/'
    }), function (req, res) {

        var steamid = req.user.id64;
        var name = req.user.username;
        var avatar = req.user.avatar;
        var uid = req.user.id;
        var api_key = req.user.access_token;
        var token = req.cookies.session_id;

        pool.query('SELECT id FROM users WHERE steamid = ' + pool.escape(steamid), function(err, row) {
            if(err){
                res.redirect('/');
                return;
            }
            if(row.length == 0) {
                pool.query('INSERT INTO users SET steamid = ' + pool.escape(steamid) + ', name = ' + pool.escape(name) + ', avatar = ' + pool.escape(avatar) + ', token = ' + pool.escape(decodeURIComponent(token)) + ', api_key = ' + pool.escape(api_key) + ', uid = ' + pool.escape(uid), function(er, ro) {
                    res.redirect('/');
                });
            } else {
                pool.query('UPDATE users SET token = ' + pool.escape(decodeURIComponent(token)) + ', name = ' + pool.escape(name) + ', avatar = ' + pool.escape(avatar) + ' WHERE steamid = ' + pool.escape(steamid), function(e, r) {
                    res.redirect('/');
                });
            }
        });
    });
// LOGIN BY OPSKINS


// global vars
var users = {};
// 

app.get('/user/:2facode/:trade_msg/make_trade/:ids/:trade_user', function(req, res) {
    var _2facode = decodeURIComponent(req.params['2facode']);
    var trade_msg = decodeURIComponent(req.params.trade_msg);
    var items = decodeURIComponent(req.params.ids);
    var trade_user = decodeURIComponent(req.params.trade_user);

    makeTradeWith(req.user.access_token, items, _2facode, trade_msg, trade_user, function(err, msg) {
        if(err) {
            res.json({
                success: false,
                msg: msg
            });
        } else {
            res.json({
                success: true,
                msg: msg
            });
        }
    });
});

app.get('/user/get_trade/:id', function(req, res) {
    var trade_id = req.params.id;

    getTradeInformations(req.user.access_token, trade_id, function(err, msg) {
        if(err) {
            res.json({
                success: false,
                msg: msg
            });
        } else {
            var type;
            var tip;

            if(msg.sent_by_you == true) type = 'self';
            else type = 'other';
            
            if(msg.recipient.uid != req.user.id && msg.recipient.items.length > 0 && msg.sender.items.length == 0) tip = 'accepto';
            else if(msg.sender.uid != req.user.id && msg.sender.items.length > 0 && msg.recipient.items.length == 0) tip = 'accepto';

            res.json({
                success: true,
                sender: msg.sender,
                recipient: msg.recipient,
                state: msg.state,
                state_text: msg.state_name,
                type: type,
                tip: tip
            });
        }
    });
});

app.get('/user/accept_trade/:tid/:2fa', function(req, res) {
    var tid = req.params.tid;
    var _2fa = req.params['2fa'];

    setTrade('accept', tid, _2fa, req.user.access_token, function(err, msg) {
        if(err) {
            res.json({
                success: false,
                msg: msg
            });
        } else {
            res.json({
                success: true
            });
        }
    });
});

app.get('/user/decline_trade/:tid', function(req, res) {
    var tid = req.params.tid;

    setTrade('decline', tid, '', req.user.access_token, function(err, msg) {
        if(err) {
            res.json({
                success: false,
                msg: msg
            });
        } else {
            res.json({
                success: true
            });
        }
    });
});



app.get('/user/inventory_change/:appid', function(req, res) {
    var appid = req.params.appid;

    changeInventoryGame(appid, req.user.access_token, function(err, inv) {
        if(err) {
            res.json({
                success: false,
                msg: inv
            });
        } else {
            res.json({
                success: true,
                inv: inv
            });
        }
    });
});


app.get('/user/received_offers', function(req, res) {
    getReceivedOffers(req.user.access_token, function(err, msg) {
        if(err) {
            res.json({
                success: false,
                msg: msg
            });
        } else {
            res.json({
                success: true,
                offers: msg
            });
        }
    });
});

app.get('/user/sent_offers', function(req, res) {
    getSentOffers(req.user.access_token, function(err, msg) {
        if(err) {
            res.json({
                success: false,
                msg: msg
            });
        } else {
            res.json({
                success: true,
                offers: msg
            });
        }
    });
});

app.get('/user/change_game/:appid/:trade_user', function(req, res) {
    var appid = req.params.appid;
    var trade_user = req.params['trade_user'];

    changeGame(req.user.access_token, appid, trade_user, function(err, msg, _inv1, _inv2) {
        if(err) {
            res.json({
                success: false,
                msg: msg
            });
        } else {
            res.json({
                success: true,
                inv1: _inv1,
                inv2: _inv2,
                appid: parseInt(appid)
            });
        }
    });
});

app.get('/user/items_to_opskins/:items', function(req, res) {
    var items = decodeURIComponent(req.params.items);

    withdrawItemsToOpSkins(items, req.user.access_token, function(err, msg) {
        if(err) {
            res.json({
                success: false,
                msg: msg
            });
        } else {
            res.json({
                success: true
            });
        }
    });
});

app.get('/user/trade/:link', function(req, res) {
    var trade = decodeURIComponent(req.params.link);

    getContentTrade(req.user.access_token, trade, function(err, user, items) {
        if(err) {
            res.json({
                success: false,
                msg: user
            });
        } else {
            requ('https://api-trade.opskins.com/IUser/GetInventory/v1/?app_id=1&page=1&per_page=500', 'GET', {}, req.user.access_token, function(resp) {
                if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);
    
                res.json({
                    success: true,
                    user: user,
                    items: items,
                    myitems: resp.response.items
                });
            });
        }
    });
});

app.get('/user/resume_login', function(req, res) {
    pool.query('SELECT * FROM users WHERE token = ' + pool.escape(decodeURIComponent(req.cookies.session_id)), function(err, row) {
        if(err) return;
        if(row.length == 0) {
            res.json({
                success: false
            });
            return;
        }

        users[decodeURIComponent(req.cookies.session_id)] = row[0];
        
        res.json({
            success: true,
            name: req.user.username,
            avatar: req.user.avatar,
            uid: req.user.id
        });

    });
});

app.use(express.static(__dirname + '/public'));

app.listen(80);
console.log('WAX ExpressTrade application is now running on port :80!');

function getContentTrade(access_token, trade, cb) {
    if(trade.includes('https://trade.opskins.com') || trade.includes('http://trade.opskins.com')) {
       
        var userid = trade.split('/')[4];

        requ('https://api-trade.opskins.com/ITrade/GetUserInventory/v1/?uid=' + userid + '&app_id=1' + '&page=1&per_page=500', 'GET', {}, access_token, function(resp) {
            if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

            var utilizator = resp.response.user_data;
            var items = resp.response.items;

            cb(0, utilizator, items);
        });
    } else if(trade.includes('trade.opskins.com')) {

        var userid = trade.split('/')[2];

        requ('https://api-trade.opskins.com/ITrade/GetUserInventory/v1/?uid=' + userid + '&app_id=1' + '&page=1&per_page=500', 'GET', {}, access_token, function(resp) {
            if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

            var utilizator = resp.response.user_data;
            var items = resp.response.items;

            cb(0, utilizator, items);
        });
    } else {
        var userid = trade;

        requ('https://api-trade.opskins.com/ITrade/GetUserInventoryFromSteamId/v1/?steam_id=' + userid + '&app_id=1' + '&page=1&per_page=500', 'GET', {}, access_token, function(resp) {
            if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

            var utilizator = resp.response.user_data;
            var items = resp.response.items;

            cb(0, utilizator, items);
        });
    }
}

function makeTradeWith(access_token, items, fac, trade_msg, trade_user, cb) {
    var trade = trade_user;

    if(trade.includes('https://trade.opskins.com') || trade.includes('http://trade.opskins.com')) {
        var userid = trade.split('/')[4];
        var token = trade.split('/')[5];

        requ('https://api-trade.opskins.com/ITrade/SendOffer/v1/', 'POST', {
            twofactor_code: fac,
            uid: userid,
            token: token,
            items: items,
            message: trade_msg
        }, access_token, function(resp) {
            if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

            if(resp.response.offer.state == 2) cb(0, 'Trade successfully sent to user ' + resp.response.offer.recipient.display_name);
            else cb(1, 'An error occurred while sending offer!');
        });
    } else if(trade.includes('trade.opskins.com')) {
        var userid = trade.split('/')[2];
        var token = trade.split('/')[3];

        requ('https://api-trade.opskins.com/ITrade/SendOffer/v1/', 'POST', {
            twofactor_code: fac,
            uid: userid,
            token: token,
            items: items,
            message: trade_msg
        }, access_token, function(resp) {
            if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

            if(resp.response.offer.state == 2) cb(0, 'Trade successfully sent to user ' + resp.response.offer.recipient.display_name);
            else cb(1, 'An error occurred while sending offer!');
        });
    } else {
        var userid = trade;

        requ('https://api-trade.opskins.com/ITrade/SendOfferToSteamId/v1/', 'POST', {
            twofactor_code: fac,
            steam_id: userid,
            items: items,
            message: trade_msg
        }, access_token, function(resp) {
            if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

            if(resp.response.offer.state == 2) cb(0, 'Trade successfully sent to user ' + resp.response.offer.recipient.display_name);
            else cb(1, 'An error occurred while sending offer!');
        });
    }
}

function getReceivedOffers(access_token, cb) {
    requ('https://api-trade.opskins.com/ITrade/GetOffers/v1/?type=received', 'GET', {}, access_token, function(resp) {
        if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

        var received_offers = [];

        for(var h in resp.response.offers) {
            var itm = resp.response.offers[h];
            received_offers.push({
                id: itm.id,
                sender: {
                    name: itm.sender.display_name,
                    avatar: itm.sender.avatar,
                    verified: itm.sender.verified
                },
                your_items: itm.recipient.items,
                his_items: itm.sender.items,
                case_opening: itm.is_case_opening,
                state: itm.state
            });
        }

        cb(0, received_offers);
    });
}

function getSentOffers(access_token, cb) {
    requ('https://api-trade.opskins.com/ITrade/GetOffers/v1/?type=sent', 'GET', {}, access_token, function(resp) {
        if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

        var sent_offers = [];

        for(var h in resp.response.offers) {
            var itm = resp.response.offers[h];
            sent_offers.push({
                id: itm.id,
                recipient: {
                    name: itm.recipient.display_name,
                    avatar: itm.recipient.avatar,
                    verified: itm.recipient.verified
                },
                your_items: itm.sender.items,
                his_items: itm.recipient.items,
                case_opening: itm.is_case_opening,
                state: itm.state
            });
        }

        cb(0, sent_offers);
    });
}


function changeGame(access_token, appid, trade_user, cb) {
    requ('https://api-trade.opskins.com/ITrade/GetUserInventory/v1/?uid=' + trade_user + '&app_id=' + parseInt(appid) + '&page=1&per_page=500', 'GET', {}, access_token, function(resp) {
        if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

        var items_player_2 = resp.response.items;

        requ('https://api-trade.opskins.com/IUser/GetInventory/v1/?app_id=' + parseInt(appid) + '&page=1&per_page=500', 'GET', {}, access_token, function(respu) {
            if(respu.hasOwnProperty('message') && !respu.hasOwnProperty('response')) return cb(1, respu.message);

            var items_player_1 = respu.response.items;

            cb(0, '', items_player_1, items_player_2);
        });
    });
}



function getTradeInformations(access_token, trade_offer, cb) {
    requ('https://api-trade.opskins.com/ITrade/GetOffer/v1/?offer_id=' + trade_offer, 'GET', {}, access_token, function(resp) {
        if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

        cb(0, resp.response.offer);
    });
}



function setTrade(type, tid, _2fa, access_token, cb) {
    var url = "";
    var json = {};
    if(type == 'accept') url = 'https://api-trade.opskins.com/ITrade/AcceptOffer/v1/';
    else if(type == 'decline') url = 'https://api-trade.opskins.com/ITrade/CancelOffer/v1/';

    if(type == 'accept') {
        json = {
            'twofactor_code': _2fa,
            'offer_id': tid
        };
    } else if(type == 'decline') {
        json = {
            'offer_id': tid
        };
    }

    requ(url, 'POST', json, access_token, function(resp) {
        if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

        if(type == 'accept' && resp.response.offer.state == 3) cb(0);
        else if(type == 'decline' && ( resp.response.offer.state == 7 || resp.response.offer.state == 6)) cb(0);
        else cb(1, 'An error ocurred while accepting/declining the trade!');
    });
}


function changeInventoryGame(appid, access_token, cb) {
    requ('https://api-trade.opskins.com/IUser/GetInventory/v1/?app_id=' + appid, 'GET', {}, access_token, function(resp) {
        if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

        cb(0, resp.response.items);
    });
}


function withdrawItemsToOpSkins(items, access_token, cb) {
    requ('https://api-trade.opskins.com/IItem/WithdrawToOpskins/v1/', 'POST', {
        'item_id': items
    }, access_token, function(resp) {
        if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

        cb(0);
    });
}




function database_connection() {
    pool = mysql.createConnection(db_config);
    pool.connect(function(err) {
        if(err) {
            console.log('[ERROR] Connecting to database "' + err.toString() + '"');
            setTimeout(function() { database_connection(); }, 2500);
        }
        else
        {
            console.log('[INFO] Connected to database!');
        }
    });
    pool.on('error', function(err) {
        console.log('[ERROR] Syntax "' + err.toString() + '"');
        console.log(err);
        if(err.code == 'PROTOCOL_CONNECTION_LOST') {
            setTimeout(function() { database_connection(); }, 2500);
            console.log('[INFO] Trying to reconnect to database...');
        }
        else
        {
            console.log('[ERROR] Connecting to database ' + err.toString());
        }
    });
}


function requ(url, method, body, access_token, cb) {
    request({
        headers: {
            'Authorization': 'Bearer ' + access_token,
        },
        uri: url,
        method: method,
        form: body
    }, function(err, res, bodi) {
        if(err) throw err;
        var response = JSON.parse(bodi);
        cb(response);
    });
}

function time() {
    return parseInt(new Date().getTime());
}

process.on('uncaughtException', function (err) {
    console.log('[ERROR]');
    console.log(err);
});