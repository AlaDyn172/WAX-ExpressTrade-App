var express = require('express');
var request = require('request');
var app = express();

var passport = require('passport');
var CustomStrategy = require('passport-custom');
var opAuth = require('opskins-oauth');

app.use(passport.initialize());

let OpskinsAuth = new opAuth.init({
    name: 'Echo WAX ExpressTrade',
    returnURL: 'http://chatahah.com/auth/login/user',
    apiKey: 'abd65f27b30dcccc9bdc6e7cb5bf9b',
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

var server = require('http').Server(app);
var io = require('socket.io')(server);

var states = {};

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('pages/home');
});

app.get('/auth/login', function (req, res) {
    OpskinsAuth.getFetchUrl(function(returnUri, state) {
        res.redirect(returnUri);
        states[state] = {};
    });
});

app.get('/auth/login/user', passport.authenticate('custom', {
    failureRedirect: '/'
}), function (req, res) {
    states[req.query.state] = req.user;
    states[req.query.state].refresh_token = req.user.refresh_token;

    res.redirect('/?state=' + req.query.state + "&refresh_token=" + req.user.refresh_token + "&type=login");
});

server.listen(80, function() {
    console.log(new Date() + ' Server is up an running!');
});

var users = {};

io.on('connection', function(socket) {
    var user = null;

    socket.on('log', function(state) {
        if(states.hasOwnProperty(state)) {
            user = state;
            users[state] = states[state];
            users[state].state = state;
            socket.emit('user info', users[state]);
        }
    });

    socket.on('user trade', function(trade) {
        if(!user) return;
        getContentsTrade(users[user], trade, function(err, useru, items) {
            if(err) return socket.emit('user eoare', 'There was a problem while getting the inventory of user set!');
            GetMyInventory(users[user], 1, function(err, myitems) {
                if(err) return socket.emit('user eoare', 'There was a problem while getting your inventory!');
                socket.emit('user trade', useru, items, myitems);
            });
        });
    });

    socket.on('user send trade', function(_2fa, msg, itbs, itbr, trade_user) {
        if(!user) return;
        userMakeTrade(users[user], _2fa, msg, itbs, itbr, trade_user, function(err, msg) {
            if(err) return socket.emit('user eroare', msg);
            socket.emit('user alerta', msg);
        });
    });

    socket.on('user offers', function() {
        if(!user) return;
        getOffers(users[user], function(err, offers) {
            if(err) return socket.emit('user eroare', 'An error occured while getting your ' + type + ' offers!');
            socket.emit('user offers', offers);
        });
    });

    socket.on('user change game', function(appid, trade) {
        if(!user) return;
        userChangeGame(users[user], appid, trade, function(err, myitems, items) {
            if(err) return socket.emit('user eroare', 'An error ocurred whle getting both users inventory!');
            socket.emit('user change game', myitems, items, appid);
        });
    });
    
    socket.on('user change inventory', function(appid) {
        if(!user) return;
        userChangeInventory(users[user], appid, function(err, items) {
            if(err) return socket.emit('user eroare', 'An error ocurred whle getting your inventory!');
            socket.emit('user change inventory', items);
        });
    });

    socket.on('user withdraw to opskins', function(iteme) {
        if(!user) return;
        var items = decodeURIComponent(iteme);
        if(items.split(',').length == 0) return socket.emit('user eroare', 'You need to select at least one item to Withdraw to OPSkins!');
        userWithdrawToOPSkins(users[user], items, function(err) {
            if(err) return socket.emit('user eroare', 'There was a problem while withdrawing items to OPSkins!');
            socket.emit('user withdraw to opskins success');
        });
    });

    socket.on('user get trade', function(trade) {
        if(!user) return;
        userGetTradeInformations(users[user], trade, function(err, td) {
            if(err) socket.emit('user eroare', 'An error occurred while checking the trade!');
            var type;
            var tip;

            if(td.sent_by_you == true) type = 'self';
            else type = 'other';

            if(td.is_gift == true) tip = 'accepto';

            socket.emit('user get trade', trade, td.sender, td.recipient, td.state, td.state_name, td.is_case_opening, type, tip);
        });
    });

    socket.on('user accept trade', function(trade, _2fa) {
        if(!user) return;
        userSetTrade(users[user], 'accept', trade, _2fa, function(err) {
            if(err) return socket.emit('user eroare', 'An error occurred while accepting the trade #' + trade + '!');
            socket.emit('user alerta', 'Successfully accepted the trade #' + trade + '!');
        });
    });

    socket.on('user decline trade', function(trade) {
        if(!user) return;
        userSetTrade(users[user], 'decline', trade, _2fa, function(err) {
            if(err) return socket.emit('user eroare', 'An error occurred while declining the trade #' + trade + '!');
            socket.emit('user alerta', 'Successfully declined the trade #' + trade + '!');
        });
    });

    socket.on('logout', function() {
        if(!user);
        delete users[user];
        delete states[user];
    });
});

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

function time() {
    return parseInt(new Date().getTime()/1000);
}

function getContentsTrade(user, link, cb) {
    var trade = decodeURIComponent(link);
    if(trade.includes('https://trade.opskins.com') || trade.includes('http://trade.opskins.com')) {
        var userid = trade.split('/')[4];
        GetUserInventory(user, 1, userid, function(err, user, items) {
            cb(err, user, items);
        });
    } else if(trade.includes('trade.opskins.com')) {
        var userid = trade.split('/')[2];
        GetUserInventory(user, 1, userid, function(err, user, items) {
            cb(err, user, items);
        });
    } else {
        var userid = trade;
        GetUserInventoryFromSteamId(user, 1, userid, function(err, user, items) {
            cb(err, user, items);
        });
    }
}

function getOffers(user, cb) {
    arequest(user, 'https://api-trade.opskins.com/ITrade/GetOffers/v1/', 'GET', {}, function(resp) {
        if(!resp.hasOwnProperty('response')) return cb(1, resp);

        cb(0, resp.response.offers);
    });
}

function userChangeGame(user, appid, trade, cb) {
    GetUserInventory(user, appid, trade, function(err, useru, items) {
        if(err) return cb(err, useru);
        GetMyInventory(user, appid, function(err, itemss) {
            if(err) return cb(err, itemss);
            cb(0, itemss, items);
        });
    });
}

function userChangeInventory(user, appid, cb) {
    GetMyInventory(user, appid, function(err, items) {
        cb(err, items);
    });
}

function userWithdrawToOPSkins(user, items, cb) {
    arequest(user, 'https://api-trade.opskins.com/IItem/WithdrawToOpskins/v1/', 'POST', {
        'item_id': items
    }, function(resp) {
        if(!resp.hasOwnProperty('response')) return cb(1, resp);

        cb(0);
    });
}

function userGetTradeInformations(user, trade, cb) {
    arequest(user, 'https://api-trade.opskins.com/ITrade/GetOffer/v1/?offer_id=' + trade, 'GET', {}, function(resp) {
        if(!resp.hasOwnProperty('response')) return cb(1, resp);

        cb(0, resp.response.offer);
    });
}

function userMakeTrade(user, _2fa, msg, itbs, itbr, trade_user, cb) {
    var trade = decodeURIComponent(trade_user);
    var it_s = decodeURIComponent(itbs);
    var it_r = decodeURIComponent(itbr);

    if(itbs == 0) itbs = "";
    if(itbr == 0) itbr = "";

    if(trade.includes('https://trade.opskins.com') || trade.includes('http://trade.opskins.com')) {
        var userid = trade.split('/')[4];
        var token = trade.split('/')[5];

        SendOffer(user, _2fa, userid, token, it_s, it_r, msg, function(err, msg) {
            cb(err, msg);
        });
    } else if(trade.includes('trade.opskins.com')) {
        var userid = trade.split('/')[2];
        var token = trade.split('/')[3];

        SendOffer(user, _2fa, userid, token, it_s, it_r, msg, function(err, msg) {
            cb(err, msg);
        });
    } else {
        var userid = trade;

        SendOfferToSteamId(user, _2fa, userid, it_s, it_r, msg, function(err, msg) {
            cb(err, msg);
        });
    }
}

function SendOffer(user, _2fa, userid, token, to_be_sended, to_be_received, trade_msg, cb) {
    arequest(user, 'https://api-trade.opskins.com/ITrade/SendOffer/v1/', 'POST', {
        twofactor_code: _2fa,
        uid: userid,
        token: token,
        items_to_send: to_be_sended,
        items_to_receive: to_be_received,
        message: trade_msg
    }, function(resp) {
        if(!resp.hasOwnProperty('response')) return cb(1, resp);

        if(resp.response.offer.state == 2) cb(0, 'Trade successfully sent to user ' + resp.response.offer.recipient.display_name);
        else cb(1, 'There was a problem while sending the trade offer!');
    });
}

function SendOfferToSteamId(user, _2fa, userid, to_be_sended, to_be_received, trade_msg, cb) {
    arequest(user, 'https://api-trade.opskins.com/ITrade/SendOffer/v1/', 'POST', {
        twofactor_code: _2fa,
        steam_id: userid,
        items_to_send: to_be_sended,
        items_to_receive: to_be_received,
        message: trade_msg
    }, function(resp) {
        if(!resp.hasOwnProperty('response')) return cb(1, resp);

        if(resp.response.offer.state == 2) cb(0, 'Trade successfully sent to user ' + resp.response.offer.recipient.display_name);
        else cb(1, 'There was a problem while sending the trade offer!');
    });
}

function userSetTrade(user, type, tid, _2fa, cb) {
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

    arequest(user, url, 'POST', json, function(resp) {
        if(!resp.hasOwnProperty('response')) return cb(1, resp);

        if(type == 'accept' && resp.response.offer.state == 3) cb(0);
        else if(type == 'decline' && ( resp.response.offer.state == 7 || resp.response.offer.state == 6)) cb(0);
        else cb(1);
    });
}

function new_tokens(user, cb) {
    OpskinsAuth.getClientDetails((clientid, secret) => {
        request({
            headers: {
                Authorization: 'Basic ' + Buffer.from(clientid + ':' + secret).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            uri: "https://oauth.opskins.com/v1/access_token",
            method: "POST",
            form: {
                grant_type: 'refresh_token',
                refresh_token: user.refresh_token
            }
        }, function(err, res, bodi) {
            if(err) throw err;
            var response = JSON.parse(bodi);
            console.log(new Date());
            console.log(user);
            console.log(response);
            users[user.state].refresh_token = response.refresh_token;
            users[user.state].access_token = response.access_token;
            cb(response.access_token);
        });
    });
}

function arequest(user, url, method, body, cb) {
    request({
        headers: {
            'Authorization': 'Bearer ' + user.access_token,
        },
        uri: url,
        method: method,
        form: body
    }, function(err, res, bodi) {
        if(err) throw err;
        console.log(body);
        var response = JSON.parse(bodi);
        console.log(response);
        if(response.error) {
            new_tokens(user.state, function(atk) {
                request({
                    headers: {
                        'Authorization': 'Bearer ' + atk,
                    },
                    uri: url,
                    method: method,
                    form: body
                }, function(err, res, bodi) {
                    if(err) throw err;
                    var response = JSON.parse(bodi);
                    cb(response);
                });
            });
        } else cb(response);
    });
}

function GetUserInventory(user, appid, userid, cb) {
    arequest(user, 'https://api-trade.opskins.com/ITrade/GetUserInventory/v1/?uid=' + userid + '&app_id=' + appid + '&page=1&per_page=500', 'GET', {}, function(resp) {
        if(!resp.hasOwnProperty('response')) return cb(1, resp);

        var utilizator = resp.response.user_data;
        var items = resp.response.items;

        cb(0, utilizator, items);
    });
}

function GetUserInventoryFromSteamId(user, appid, userid, cb) {
    arequest(user, 'https://api-trade.opskins.com/ITrade/GetUserInventoryFromSteamId/v1/?steam_id=' + userid + '&app_id=' + appid + '&page=1&per_page=500', 'GET', {}, function(resp) {
        if(!resp.hasOwnProperty('response')) return cb(1, resp);

        var utilizator = resp.response.user_data;
        var items = resp.response.items;

        cb(0, utilizator, items);
    });
}

function GetMyInventory(user, appid, cb) {
    arequest(user, 'https://api-trade.opskins.com/IUser/GetInventory/v1/?app_id=' + appid + '&page=1&per_page=500', 'GET', {}, function(resp) {
        if(!resp.hasOwnProperty('response')) return cb(1, resp);

        cb(0, resp.response.items);
    });
}

process.on('uncaughtException', function (err) {
    console.log(new Date() + ' [ERROR]');
    console.log(err);
});