var express = require('express');
var request = require('request');
var path = require('path');
var app = express();

app.use(express.static(__dirname + '/www'));

app.get('/', function(req, res) {
    res.render(path.join(__dirname+'/www/index.html'));
});

app.get('/trade', function(req, res) {
    res.render(path.join(__dirname+'/www/trade.html'));
});

app.get('/auth/opskins', function(req, res) {
    res.sendFile(path.join(__dirname+'/www/index.html'));
});

var refreshes = {};


// LOGIN BY OPSKINS
    app.get('/logout/:refresh_token', function(req, res) {
        crequ('https://oauth.opskins.com/v1/revoke_token', 'POST', {
            token_type: 'refresh',
            token: req.params.refresh_token
        }, function(resp) {
            if(resp.success) res.redirect('/');
        });
    });

    app.get('/user/make_login', function(req, res) {
        crequ('https://oauth.opskins.com/v1/access_token', 'POST', {
            grant_type: 'authorization_code',
            code: decodeURIComponent(req.query.code) 
        }, function(response) {

            var access_token = response.access_token;
            var refresh_token = response.refresh_token;
            
            refreshes[req.query.state] = {
                refresh_token: refresh_token,
                access_token: access_token,
                time: parseInt(time()+1800)
            };

            res.redirect('/user/want_login?access_token=' + encodeURIComponent(access_token) + '&refresh_token=' + encodeURIComponent(refresh_token));
        });
    });

    app.get('/user/want_login', function(req, res) {
        res.sendFile(path.join(__dirname+'/www/index.html'));
    });

    app.get('/user/resume_login/:refresh_token/:access_token/:userid', function(req, res) {
        if(!refreshes.hasOwnProperty(req.params.userid)) {
            refreshes[req.params.userid] = {
                time: parseInt(time()+1800),
                refresh_token: req.params.refresh_token,
                access_token: req.params.access_token
            }
            checkTokens();
        }

        var access_token = refreshes[req.params.userid].access_token;

        requ('https://api-trade.opskins.com/IUser/GetProfile/v1/', 'GET', {}, decodeURIComponent(access_token), function(resp) {

            if(!resp.hasOwnProperty('response')) return res.redirect('/');

            res.json({
                success: true,
                name: resp.response.user.display_name,
                avatar: resp.response.user.avatar,
                uid: resp.response.user.id,
                access_token: decodeURIComponent(access_token),
                refresh_token: decodeURIComponent(req.params.refresh_token)
            });
        });
    });
// LOGIN BY OPSKINS


app.get('/user/:2facode/:trade_msg/make_trade/:to_be_sended/:to_be_received/:trade_user/:reft', function(req, res) {
    var _2facode = decodeURIComponent(req.params['2facode']);
    var trade_msg = decodeURIComponent(req.params.trade_msg);
    var to_be_sended = decodeURIComponent(req.params.to_be_sended);
    var to_be_received = decodeURIComponent(req.params.to_be_received);
    var trade_user = decodeURIComponent(req.params.trade_user);

    makeTradeWith(refreshes[req.params.reft].access_token, to_be_sended, to_be_received, _2facode, trade_msg, trade_user, res, function(err, msg) {
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

app.get('/user/get_trade/:id/:reft', function(req, res) {
    var trade_id = req.params.id;

    getTradeInformations(refreshes[req.params.reft].access_token, trade_id, res, function(err, msg) {
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

            if(msg.is_gift == true) tip = 'accepto';

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

app.get('/user/accept_trade/:tid/:2fa/:reft', function(req, res) {
    var tid = req.params.tid;
    var _2fa = req.params['2fa'];

    setTrade('accept', tid, _2fa, refreshes[req.params.reft].access_token, res, function(err, msg) {
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

app.get('/user/decline_trade/:tid/:reft', function(req, res) {
    var tid = req.params.tid;

    setTrade('decline', tid, '', refreshes[req.params.reft].access_token, res, function(err, msg) {
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



app.get('/user/inventory_change/:appid/:reft', function(req, res) {
    var appid = req.params.appid;

    changeInventoryGame(appid, refreshes[req.params.reft].access_token, res, function(err, inv) {
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


app.get('/user/received_offers/:reft', function(req, res) {
    getReceivedOffers(refreshes[req.params.reft].access_token, res, function(err, msg) {
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

app.get('/user/sent_offers/:reft', function(req, res) {
    getSentOffers(refreshes[req.params.reft].access_token, res, function(err, msg) {
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

app.get('/user/change_game/:appid/:trade_user/:reft', function(req, res) {
    var appid = req.params.appid;
    var trade_user = req.params['trade_user'];

    changeGame(refreshes[req.params.reft].access_token, appid, trade_user, res, function(err, msg, _inv1, _inv2) {
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

app.get('/user/items_to_opskins/:items/:reft', function(req, res) {
    var items = decodeURIComponent(req.params.items);

    withdrawItemsToOpSkins(items, refreshes[req.params.reft].access_token, res, function(err, msg) {
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

app.get('/user/trade/:link/:reft', function(req, res) {
    var trade = decodeURIComponent(req.params.link);

    getContentTrade(refreshes[req.params.reft].access_token, trade, res, function(err, user, items) {
        if(err) {
            res.json({
                success: false,
                msg: user
            });
        } else {
            requ('https://api-trade.opskins.com/IUser/GetInventory/v1/?app_id=1&page=1&per_page=500', 'GET', {}, refreshes[req.params.reft].access_token, function(resp) {
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

app.use(express.static(__dirname + '/public'));

app.listen(80);
console.log('WAX ExpressTrade application is now running on port :80!');

function getContentTrade(access_token, trade, res, cb) {
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

function makeTradeWith(access_token, to_be_sended, to_be_received, fac, trade_msg, trade_user, res, cb) {
    var trade = trade_user;

    if(to_be_sended == 0) to_be_sended = "";
    if(to_be_received == 0) to_be_received = "";

    if(trade.includes('https://trade.opskins.com') || trade.includes('http://trade.opskins.com')) {
        var userid = trade.split('/')[4];
        var token = trade.split('/')[5];

        requ('https://api-trade.opskins.com/ITrade/SendOffer/v1/', 'POST', {
            twofactor_code: fac,
            uid: userid,
            token: token,
            items_to_send: to_be_sended,
            items_to_receive: to_be_received,
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
            items_to_send: to_be_sended,
            items_to_receive: to_be_received,
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
            items_to_send: to_be_sended,
            items_to_receive: to_be_received,
            message: trade_msg
        }, access_token, function(resp) {
            if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

            if(resp.response.offer.state == 2) cb(0, 'Trade successfully sent to user ' + resp.response.offer.recipient.display_name);
            else cb(1, 'An error occurred while sending offer!');
        });
    }
}

function getReceivedOffers(access_token, res, cb) {
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

function getSentOffers(access_token, res, cb) {
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


function changeGame(access_token, appid, trade_user, res, cb) {
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



function getTradeInformations(access_token, trade_offer, res, cb) {
    requ('https://api-trade.opskins.com/ITrade/GetOffer/v1/?offer_id=' + trade_offer, 'GET', {}, access_token, function(resp) {
        if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

        cb(0, resp.response.offer);
    });
}



function setTrade(type, tid, _2fa, access_token, res, cb) {
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


function changeInventoryGame(appid, access_token, res, cb) {
    requ('https://api-trade.opskins.com/IUser/GetInventory/v1/?app_id=' + appid, 'GET', {}, access_token, function(resp) {
        if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

        cb(0, resp.response.items);
    });
}


function withdrawItemsToOpSkins(items, access_token, res, cb) {
    requ('https://api-trade.opskins.com/IItem/WithdrawToOpskins/v1/', 'POST', {
        'item_id': items
    }, access_token, function(resp) {
        if(resp.hasOwnProperty('message') && !resp.hasOwnProperty('response')) return cb(1, resp.message);

        cb(0);
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
        if(response.error) {
            console.log('[ERROR] - IN ATTEMPTION OF ');
            console.log(url);
            console.log(body);
            console.log(response);
            return;
        }
        cb(response);
    });
}

function crequ(url, method, body, cb) {
    request({
        headers: {
            'cache-control': 'no-cache',
            Authorization: 'Basic NTdmMmY5NWQxMGFmOlZvJEVHeiNEWFBGdWJQSihUKHlPQjF1SDZkKE1Xc0hS'
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
    return parseInt(new Date().getTime()/1000);
}

setInterval(function() {checkTokens();}, 5000);

function checkTokens() {
    for(var i in refreshes) {
        var timp = refreshes[i].time;
        var ref_token = i;

        if(timp-time() <= 0) {
            crequ('https://oauth.opskins.com/v1/access_token', 'POST', {
                grant_type: 'refresh_token',
                refresh_token: ref_token
            }, function(resp) {
                refreshes[i].access_token = resp.access_token;
                refreshes[i].time = time()+1800;
            });
        }
    }
}

process.on('uncaughtException', function (err) {
    console.log('[ERROR]');
    console.log(err);
});