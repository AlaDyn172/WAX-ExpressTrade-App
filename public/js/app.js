var user = {};

var socket = null;
var selected_items_to_send = [];
var selected_items_to_receive = [];
var trade_user = null;
var trade_uid = null;
var trade_appid = null;
var view_trade = false;
var view_trade_type;
var inventory = false;
var opskins_selected = [];
var inv_appid = null;
var refresh_token = localStorage.getItem('refresh_token');
var state = localStorage.getItem('state');
var int = null;

$(function() {
    $('.item[data-go="trade"]').addClass('hidden');
    $('.item[data-go="offers"]').addClass('hidden');
    $('.item[data-go="inventory"]').addClass('hidden');
    $('.item[data-go="friends"]').addClass('hidden');
    
    $('.container').html(`
        <center>
            <br>
            <button id="LoginNow" class="btn btn-success">
                Sign in through <b>OPSkins</b>
            </button>
        </center>
    `);

    var $gamechanges = "";

    $.ajax({
        url: "https://api-trade.opskins.com/ITrade/GetApps/v1/",
        method: 'GET',
        success: function(data) {
            var resp = data;
            for(var i in resp.response.apps) {
                var itm = resp.response.apps[i];
                $gamechanges += `<li><a class="gameChange"><img data-appid="` + itm.internal_app_id + `" src="` + itm.img + `">&nbsp;` + itm.name + `</a></li>`;
            }
        }
    });

    if(socket == null) {
        socket = io.connect();
    
        socket.on('connect', function() {
            var parts = window.location.search.substr(1).split("&");
            var $_GET = {};
            for (var i = 0; i < parts.length; i++) {
                var temp = parts[i].split("=");
                $_GET[decodeURIComponent(temp[0])] = decodeURIComponent(temp[1]);
            }

            setTimeout(function() {
                $('.app').removeClass('hidden');
                $('#loader').addClass('hidden');
            }, 1000);
    
            if($_GET['state'] && $_GET['refresh_token'] && $_GET['type'] == "login") {
                localStorage.setItem('state', $_GET['state']);
                localStorage.setItem('refresh_token', $_GET['refresh_token']);
                socket.emit('log', $_GET['state']);
            } else if(localStorage.getItem('state') && localStorage.getItem('refresh_token')) {
                socket.emit('log', localStorage.getItem('state'));
            }

            if($_GET['type'] == "trade" && $_GET['userid'] && $_GET['token']) {
                var $trade = 'https://trade.opskins.com/t/' + $_GET['userid'] + '/' + $_GET['token'];

                trade_user = $trade;
                trade_appid = 1;

                socket.emit('user trade', encodeURIComponent(trade_user));
            }
        });

        socket.on('user eroare', function(msg) {
            $.ambiance({message: msg, type: 'error'});
        });

        socket.on('user alerta', function(msg) {
            $.ambiance({message: msg, type: 'success'});
        });
    
        socket.on('user info', function(user) {
            $('.item[data-go="login"]').addClass('hidden');
            $('.profile').removeClass('hidden');
            $('.logoutBtn').removeClass('hidden');
    
            $('.item[data-go="trade"]').removeClass('hidden');
            $('.item[data-go="offers"]').removeClass('hidden');
            $('.item[data-go="inventory"]').removeClass('hidden');
            $('.item[data-go="friends"]').removeClass('hidden');
    
            $('.container').html(`
                <center>
                    <h3>TRADE ITEMS</h3>
                    <h5>Enter your trading partner's <b>WAX Trade URL</b> or <b>SteamID64</b> to initiate the trade.</h5>
                    <div class="input-field col s6">
                        <input id="trade_with" type="text">
                        <label for="trade_with">WAX Trade URL or SteamID64</label>
                        <button type="button" id="submitTradeLink" class="btn btn-success btn-block btn-lg">Trade</button>
                    </div>
                </center>
            `);
    
            $('.profile').html(`
                <a>
                    <div class="prof">
                    <img style="width: 36px;" src="` + user.avatar + `">
                    ` + user.username + `
                    </div>
                </a> 
            `);
        });

        socket.on('user trade', function(user, items, myitems) {
            $('#submitTradeLink').html('TRADE');
            $('#submitTradeLink').prop('disabled', false);

            trade_uid = user.id;
            var his_items = items;
            var my_items = myitems;
            var his_value = 0;
            var my_value = 0;
            if(his_items.length >= 0) his_items.sort(function(a,b) {return b.suggested_price-a.suggested_price;});
            if(my_items.length >= 0) my_items.sort(function(a,b) {return b.suggested_price-a.suggested_price;});

            var Iteme01 = "";
            var Iteme02 = "";

            for(var h in his_items) {
                var itm = his_items[h];
                Iteme02 += `
                    <div style="border: 1px solid ` + itm.color +  `;" class="item" data-id="` + itm.id + `" data-name="` + itm.name + `" data-price="` + itm.suggested_price + `">
                        <div class="image">
                            <img src="` + itm.image["600px"] + `">
                        </div>
                        <div class="price">$` + parseFloat(itm.suggested_price/100).toFixed(2) + `</div>
                        <div class="name">` + itm.name + `</div>
                    </div>
                `;
                his_value += parseInt(itm.suggested_price);
            }

            for(var h in my_items) {
                var itm = my_items[h];
                Iteme01 += `
                    <div style="border: 1px solid ` + itm.color +  `;" class="item" data-id="` + itm.id + `" data-name="` + itm.name + `" data-price="` + itm.suggested_price + `">
                        <div class="image">
                            <img src="` + itm.image["600px"] + `">
                        </div>
                        <div class="price">$` + parseFloat(itm.suggested_price/100).toFixed(2) + `</div>
                        <div class="name">` + itm.name + `</div>
                    </div>
                `;
                my_value += parseInt(itm.suggested_price);
            }

            if(his_items.length == 0) Iteme02 = `<div style=" margin: 75px auto auto auto; ">No items in his inventory</div>`;
            if(my_items.length == 0) Iteme01 = `<div style=" margin: 75px auto auto auto; ">No items in your inventory</div>`;

            $('.container').html(`
                <center>
                    <h3>TRADE ITEMS</h3>
                    <h5>You are trading with&nbsp;<b><img style="width: 31px; border-radius: 50%; margin-bottom: -6px; margin-right: -4px;" src="` + user.avatar + `">&nbsp;` + user.username + `</b></h5>
                    <small id="your_inv_text">Your inventory ($` + parseFloat(my_value/100).toFixed(2) + `)</small>
                    <div class="your_inventory">` + Iteme01 + `</div>
                    <a class='dropdown-trigger btn' href='#gamePicker' data-target='gamePicker'><img src="https://opskins.com/images/games/logo-small-vgo.jpg">&nbsp;<i class="fas fa-angle-down"></i></a>
                    <ul id='gamePicker' class='dropdown-content dropdownul'>` + $gamechanges + `</ul>
                    <small id="his_inv_text">His inventory ($` + parseFloat(his_value/100).toFixed(2) + `)</small>
                    <div class="his_inventory">` + Iteme02 + `</div>
                    <div class="input-field col s6">
                        <input id="tradeMessageNow" type="text">
                        <label for="tradeMessageNow">Type a message for the trade</label>
                    </div>
                    <div class="input-field col s6">
                        <input id="trade2FAcode" type="text" maxlength="6">
                        <label for="trade2FAcode">Type 2 factor authentication code</label>
                    </div>
                    <button type="button" class="btn btn-success btn-block btn-lg" id="tradeItemsNow" disabled>Send trade</button>
                </center>
            `);

            $('.dropdown-trigger').dropdown();

            addNewFriend(user.avatar, user.username, trade_user);
        });

        socket.on('user offers', function(offers) {
            var $html = "";

            for(var h in offers) {
                var itm = offers[h];

                var $verified = "";
                if(itm.sent_by_you && itm.recipient.verified) $verified = '&nbsp;<i class="fa fa-check-circle text-success" style="color: #28a745;"></i>';
                else if(!itm.sent_by_you && itm.sender.verified) $verified = '&nbsp;<i class="fa fa-check-circle text-success" style="color: #28a745;"></i>';

                var $case_opening = "";
                if(itm.is_case_opening) $case_opening = '<img style="width: 25px; height: 18px;" src="data:image/png;base64,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">&nbsp;';

                var $state = "";
                if(itm.state == 2 || itm.state == 9) $state = '<span style="color: orange;">PENDING</span>';
                else if(itm.state == 3) $state = '<span style="color: lightgreen;">ACCEPTED</span>';
                else if(itm.state == 5 || itm.state == 10) $state = '<span style="color: red;">EXPIRED</span>';
                else if(itm.state == 6) $state = '<span style="color: red;">CANCELED</span>';
                else if(itm.state == 7) $state = '<span style="color: red;">DECLINED</span>';
                else if(itm.state == 12) $state = '<span style="color: red;">FAILED</span>';
                else if(itm.state == 8) $state = '<span style="color: red;">INVALID ITEMS</span>';

                var $name = "";
                var $give = "";
                var $get = "";

                if(itm.sent_by_you) $name = itm.recipient.display_name;
                else $name = itm.sender.display_name;

                var val01 = 0;
                var val02 = 0;
                var $style_give = "";
                var $style_get = "";
                var $type = "";
                for(var i in itm.sender.items) {
                    val01 += parseInt(itm.sender.items[i].suggested_price);
                }
                for(var i in itm.recipient.items) {
                    val02 += parseInt(itm.recipient.items[i].suggested_price);
                }

                if(itm.sent_by_you) {
                    if(isNaN(val01)) val01 = 0.00;
                    if(isNaN(val02)) val02 = 0.00;
                    $give = `
                        <span class="info1"><i class="far fa-eye"></i>&nbsp;GIVE</span><span class="info2">$` + parseFloat(val01/100).toFixed(2) + `<i class="fas fa-long-arrow-alt-right"></i></span>
                    `;
                    if(val01 <= 0.01) $style_give = "opacity: 0.15";
                    if(val02 <= 0.01) $style_get = "opacity: 0.15";
                    $get = `
                        <span class="info1"><i class="far fa-eye"></i>&nbsp;GET</span><span class="info2">$` + parseFloat(val02/100).toFixed(2) + `<i class="fas fa-long-arrow-alt-left"></i></span>
                    `;
                    $type = "sent";
                }
                else {
                    if(isNaN(val01)) val01 = 0.00;
                    if(isNaN(val02)) val02 = 0.00;
                    if(val01 <= 0.01) $style_get = 'opacity: 0.15';
                    if(val02 <= 0.01) $style_give = 'opacity: 0.15';
                    $give = `
                        <span class="info1"><i class="far fa-eye"></i>&nbsp;GIVE</span><span class="info2">$` + parseFloat(val02/100).toFixed(2) + `<i class="fas fa-long-arrow-alt-right"></i></span>
                    `;
                    $get = `
                        <span class="info1"><i class="far fa-eye"></i>&nbsp;GET</span><span class="info2">$` + parseFloat(val01/100).toFixed(2) + `<i class="fas fa-long-arrow-alt-left"></i></span>
                    `;
                    $type = "received";
                }

                $html += `
                    <div class="offer" data-id="` + itm.id + `" data-type="` + $type + `">
                        <div class="row">
                        <div class="col s12">
                            <div class="user">
                                <div class="ify">`+$case_opening+$verified+`</div>
                                <div class="name">`+$name+`</div>
                            </div>
                            <div class="status">
                                STATUS: ` + $state + `
                            </div>
                        </div>
                        <div class="col s6 give" style="` + $style_give + `">
                            ` + $give + `
                        </div>
                        <div class="col s6 get" style="` + $style_get + `">
                            ` + $get + `
                        </div>
                        </div>
                    </div>
                `;
            }

            $('.offers').html($html);
        });

        socket.on('user change game', function(inv1, inv2, appid) {
            trade_appid = appid;
            selected_items_to_send = [];
            selected_items_to_receive = [];

            var his_items = inv2;
            var my_items = inv1;
            var his_value = 0;
            var my_value = 0;

            if(his_items.length >= 0) his_items.sort(function(a,b) {return b.suggested_price-a.suggested_price;});
            if(my_items.length >= 0) my_items.sort(function(a,b) {return b.suggested_price-a.suggested_price;});

            var Iteme01 = "";
            var Iteme02 = "";

            for(var h in his_items) {
                var itm = his_items[h];

                var $name = "";
                var $image = "";
                if(appid == 12) { $name = itm.market_name; $image = itm.image;}
                else { $name = itm.name; $image = itm.image["600px"];}

                Iteme02 += `
                    <div style="border: 1px solid ` + itm.color +  `;" class="item" data-id="` + itm.id + `" data-name="` + $name + `" data-price="` + itm.suggested_price + `">
                        <div class="image">
                            <img src="` + $image + `">
                        </div>
                        <div class="price">$` + parseFloat(itm.suggested_price/100).toFixed(2) + `</div>
                        <div class="name">` + $name + `</div>
                    </div>
                `;
                if(itm.suggested_price != null) his_value += parseInt(itm.suggested_price);
            }

            for(var h in my_items) {
                var itm = my_items[h];

                var $name = "";
                var $image = "";
                if(appid == 12) { $name = itm.market_name; $image = itm.image;}
                else { $name = itm.name; $image = itm.image["600px"];}

                Iteme01 += `
                    <div style="border: 1px solid ` + itm.color +  `;" class="item" data-id="` + itm.id + `" data-name="` + $name + `" data-price="` + itm.suggested_price + `">
                        <div class="image">
                            <img src="` + $image + `">
                        </div>
                        <div class="price">$` + parseFloat(itm.suggested_price/100).toFixed(2) + `</div>
                        <div class="name">` + $name+ `</div>
                    </div>
                `;
                if(itm.suggested_price != null) my_value += parseInt(itm.suggested_price);
            }

            if(his_items.length == 0) Iteme02 = `<div style=" margin: 75px auto auto auto; ">No items in his inventory</div>`;
            if(my_items.length == 0) Iteme01 = `<div style=" margin: 75px auto auto auto; ">No items in your inventory</div>`;
            

            $('.container #your_inv_text').html('Your inventory ($' + parseFloat(my_value/100).toFixed(2) + ')');
            $('.container .your_inventory').html(Iteme01);
            $('.container #his_inv_text').html('His inventory ($' + parseFloat(his_value/100).toFixed(2) + ')');
            $('.container .his_inventory').html(Iteme02);
            
        });

        socket.on('user change inventory', function(inv) {
            var my_value = 0;
            var my_items = inv;
            var Iteme = "";

            if(my_items.length >= 0) my_items.sort(function(a,b) {return b.suggested_price-a.suggested_price;});

            for(var h in my_items) {
                var itm = my_items[h];

                var $name = "";
                var $image = "";
                if(inv_appid == 12) { $name = itm.market_name; $image = itm.image;}
                else { $name = itm.name; $image = itm.image["600px"];}

                Iteme += `
                    <div style="border: 1px solid ` + itm.color +  `;" class="item" data-id="` + itm.id + `" data-name="` + $name + `" data-price="` + itm.suggested_price + `">
                        <div class="image">
                            <img src="` + $image + `">
                        </div>
                        <div class="price">$` + parseFloat(itm.suggested_price/100).toFixed(2) + `</div>
                        <div class="name">` + $name + `</div>
                    </div>
                `;
                if(itm.suggested_price != null) my_value += parseInt(itm.suggested_price);
            }

            $('#your_inv_total_value').html('Inventory total value: $' + parseFloat(my_value/100).toFixed(2));

            if(my_items.length == 0) Iteme = `<div style=" margin: 75px auto auto auto; ">No items in your inventory</div>`;

            $('.see_inventory').html(Iteme);
        });

        socket.on('user withdraw to opskins success', function() {
            $.ambiance({message: 'You have successfully withdrawn the item(s) to OPSkins!', type: 'success'});
            $('#withdrawto_opskins').html('Withdraw item(s) to OPSkins');
            socket.emit('user change inventory', inv_appid);
        });

        socket.on('user get trade', function(tradeid, sender, recipient, state, state_text, case_opening, type, tip) {
            var items1 = "";
            var items2 = "";
            var items1_val = 0;
            var items2_val = 0;

            if(sender.items.length >= 0) sender.items.sort(function(a,b) {return b.suggested_price-a.suggested_price;});
            if(recipient.items.length >= 0) recipient.items.sort(function(a,b) {return b.suggested_price-a.suggested_price;});

            for(var i in sender.items) {
                var itm = sender.items[i];

                var $name = "";
                var $image = "";
                if(inv_appid == 12) { $name = itm.market_name; $image = itm.image;}
                else { $name = itm.name; $image = itm.image["600px"];}
                
                items1 += `
                    <div style="border: 1px solid ` + itm.color +  `;" class="item" data-id="` + itm.id + `" data-name="` + $name + `" data-price="` + itm.suggested_price + `">
                        <div class="image">
                            <img src="` + $image + `">
                        </div>
                        <div class="price">$` + parseFloat(itm.suggested_price/100).toFixed(2) + `</div>
                        <div class="name">` + itm.name + `</div>
                    </div>
                `;
                if(itm.suggested_price != null) items1_val += parseInt(itm.suggested_price);
            }

            for(var i in recipient.items) {
                var itm = recipient.items[i];

                var $name = "";
                var $image = "";
                if(inv_appid == 12) { $name = itm.market_name; $image = itm.image;}
                else { $name = itm.name; $image = itm.image["600px"];}

                items2 += `
                    <div style="border: 1px solid ` + itm.color +  `;" class="item" data-id="` + itm.id + `" data-name="` + $name + `" data-price="` + itm.suggested_price + `">
                        <div class="image">
                            <img src="` + $image + `">
                        </div>
                        <div class="price">$` + parseFloat(itm.suggested_price/100).toFixed(2) + `</div>
                        <div class="name">` + itm.name + `</div>
                    </div>
                `;
                if(itm.suggested_price != null) items2_val += parseInt(itm.suggested_price);
            }

            $buttons = '';
            if(state == 2 && type == 'self') $buttons = '<div style="margin-top: 15px;"><button data-trade="' + tradeid + '" id="trade_decline_trade" class="btn">DECLINE</button></div>';
            else if(state == 2 && type == 'other' && tip == 'accepto') $buttons = '<div style="margin-top: 15px;"><button data-trade="' + tradeid + '" id="trade_accept_trade_" class="btn">ACCEPT</button>&nbsp;<button data-trade="' + tradeid + '" id="trade_decline_trade" class="btn">DECLINE</button></div>';
            else if(state == 2 && type == 'other') $buttons = '<div style="margin-top: 15px;"><input id="trade_accept_2fa" type="text" placeholder="2FA code for accepting trade">&nbsp;<button data-trade="' + tradeid + '" id="trade_accept_trade" class="btn" disabled>ACCEPT</button>&nbsp;<button data-trade="' + tradeid + '" id="trade_decline_trade" class="btn">DECLINE</button></div>';

            var text1 = "";
            var text2 = "";

            if(view_trade_type == 'received') {
                text1 = 'His';
                text2 = 'Your';
            } else if(view_trade_type == 'sent') {
                text1 = 'Your';
                text2 = 'His';
            }

            if(case_opening) {
                var keys = recipient.items.length;

                var key = `
                    <div style="border: 1px solid ` + recipient.items[0].color +  `;" class="item" data-id="` + recipient.items[0].id + `" data-name="` + recipient.items[0].name + `" data-price="` + recipient.items[0].suggested_price + `">
                        <div class="amount">`+keys+`x</div>
                        <div class="image">
                            <img src="` + recipient.items[0].image["600px"] + `">
                        </div>
                        <div class="price">$` + parseFloat(recipient.items[0].suggested_price/100).toFixed(2) + `</div>
                        <div class="name">` + recipient.items[0].name + `</div>
                    </div>
                `;

                $('.container').html(`
                <center>
                    <h5><i class="fas fa-arrow-alt-circle-left fa-2x backViewTrade" style="color: #66cccc;"></i></h5>
                    <h3 style="margin-top: -15px;">VIEWING CASE OPENING TRADE</h3>
                    <h5>Trade: #` + tradeid + ` - State: ` + state + ` - State name: ` + state_text + `</h5>
                    <h5 class="case_opening">` + key + `</h5>
                    <h5>Your items won ($` + parseFloat(items1_val/100).toFixed(2) + `)</h5>
                    <div class="see_inventory">` + items1 + `</div>
                    ` + $buttons + `
                </center>
            `);
            } else {
                $('.container').html(`
                <center>
                    <h5><i class="fas fa-arrow-alt-circle-left fa-2x backViewTrade" style="color: #66cccc;"></i></h5>
                    <h3 style="margin-top: -15px;">VIEWING TRADE</h3>
                    <h5>Trade: #` + tradeid + ` - State: ` + state + ` - State name: ` + state_text + `</h5>
                    <h5>` + text1 + ` items ($` + parseFloat(items1_val/100).toFixed(2) + `)</h5>
                    <div class="see_inventory">` + items1 + `</div>
                    <h5>` + text2 + ` items ($` + parseFloat(items2_val/100).toFixed(2) + `)</h5>
                    <div class="see_inventory">` + items2 + `</div>
                    ` + $buttons + `
                </center>
            `);
            }

            view_trade = true;
        });
    }

    $('body').on('click', '.backViewTrade', function() {
        view_trade = false;
        inventory = false;
        opskins_selected = [];
        $('.sidenav').sidenav('close');

        $('.container').html(`
            <center>
                <h3>TRADE OFFERS</h3>
                <h5>Thousands of unique virtual items available for trade</h5>
                <small>Please note: Trade Offers that are sent from verified sites will display <img src="data:image/png;base64,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" width="25"> or <i class="fa fa-check-circle text-success" style="color: #28a745;"></i> next to the account's name. Happy trading!</small>
                <div class="offers"></div>
            </center>
        `);
        $('.offers').html(`<i class="fas fa-spinner fa-spin"></i>`);
        socket.emit('user offers');
    });

    $('body').on('click', '.itemGo', function() {
        var $to = $(this).attr('data-go');

        if($to == 'login') {
            OPSkins_Login();
        } else if($to == "home") {
            window.location.href = '/';
        }
    });

    $('body').on('click', '.gameChange', function() {
        var $img = $(this).children().attr('src');
        var $app_id = $(this).children().attr('data-appid');

        $('body .dropdown-trigger').html(`
            <img src="` + $img + `">&nbsp;<i class="fas fa-angle-down"></i>
        `);

        if(inventory == false) {
            $('.container .your_inventory').html(`<i style=" margin: 75px auto auto auto; " class="fas fa-spinner fa-spin"></i>`);
            $('.container .his_inventory').html(`<i style=" margin: 75px auto auto auto; " class="fas fa-spinner fa-spin"></i>`);
            socket.emit('user change game', $app_id, trade_uid);
        } else {
            $('.container .see_inventory').html(`<i style=" margin: 75px auto auto auto; " class="fas fa-spinner fa-spin"></i>`);
            inv_appid = $app_id;
            socket.emit('user change inventory', $app_id);
        }
    });

    $('body').on('click', '#withdrawto_opskins', function() {
        if(opskins_selected.length < 1 && opskins_selected.length > 50) return $.ambiance({message: 'You can select between 1 and 50 items at once!', type: 'error'});
        if(opskins_selected.length == 0) return $.ambiance({message: 'You need to select at least one item to send it to OPSkins inventory!', type: 'error'});
        $(this).html('<i class="fas fa-spinner fa-spin"></i>');
        socket.emit('user withdraw to opskins', encodeURIComponent(opskins_selected.join(',')));
    });

    $('body').on('click', '.offers .offer', function() {
        var $trade_id = $(this).attr('data-id');
        var $trade_type = $(this).attr('data-type');
        view_trade_type = $trade_type;
        socket.emit('user get trade', $trade_id);
    });

    $('body').on('keyup', '#trade_accept_2fa', function() {
        if($(this).val().length == 6) $('#trade_accept_trade').prop('disabled', false);
        else $('#trade_accept_trade').prop('disabled', true);
    });

    $('body').on('click', '#trade_accept_trade_', function() {
        var $2fa = 123456;
        var $trade_id = $(this).attr('data-trade');
        if($2fa == '') return $.ambiance({message: 'Invalid two-factor authentication code!', type: 'error'});
        socket.emit('user accept trade', $trade_id, $2fa);
    });

    $('body').on('click', '#trade_accept_trade', function() {
        var $2fa = $('#trade_accept_2fa').val();
        var $trade_id = $(this).attr('data-trade');
        if($2fa == '') return $.ambiance({message: 'Invalid two-factor authentication code!', type: 'error'});
        socket.emit('user accept trade', $trade_id, $2fa);
    });

    $('body').on('click', '#trade_decline_trade', function() {
        var $trade_id = $(this).attr('data-trade');
        socket.emit('user decline trade', $trade_id);
    });

    $('body').on('click', '#LoginNow', function() {
        OPSkins_Login();
        $('#LoginNow').html('<i class="fas fa-spinner fa-spin"></i>');
    });

    $('body').on('click', '.makeOfferFriend', function() {
        var $trade = $(this).attr('data-trade');

        $(this).html('<i class="fas fa-spinner fa-spin"></i>');

        trade_user = $trade;
        trade_appid = 1;

        if($trade.length >= 17) socket.emit('user trade', $trade);
        else {
            if($trade.length == 0) return;
            $.ambiance({message: "Steamid not valid!", type: 'error'});
        }
    });

    $('body').on('click', '#submitTradeLink', function() {
        var $trade = $('#trade_with').val();

        trade_user = $trade;
        trade_appid = 1;

        if($trade.length >= 17) {
            socket.emit('user trade', encodeURIComponent(trade_user));
            $(this).html('<i class="fas fa-spinner fa-spin"></i>');
            $(this).prop('disabled', true);
        } else {
            if($trade.length == 0) {
                $(this).prop('disabled', false);
                $(this).html('TRADE');
                return;
            }
            $.ambiance({message: "Steamid not valid!", type: 'error'});
            $(this).html('TRADE');
            $(this).prop('disabled', false);
        }
    });

    $('body').on('click', '#tradeItemsNow', function() {
        if($('#trade2FAcode').val().length != 6) return $.ambiance({message: 'Invalid 2FA code!', type: 'error'});
        var $msg_trade;
        if($('#tradeMessageNow').val() == '') $msg_trade = 'Trade sent using WAX ExpressTrade App by @AlaDyn172';
        else $msg_trade = $('#tradeMessageNow').val();
        var fconcated = selected_items_to_send.concat(selected_items_to_receive);
        var items_to_be_sended = selected_items_to_send.join(',');
        var items_to_be_received = selected_items_to_receive.join(',');
        if(selected_items_to_send.length == 0) items_to_be_sended = '';
        if(selected_items_to_receive.length == 0) items_to_be_received = '';
        if(fconcated.length == 0) return $.ambiance({message: 'You can\'t send an empty offer!', type: 'error'});
        socket.emit('user send trade', encodeURIComponent($('#trade2FAcode').val()), encodeURIComponent($msg_trade), encodeURIComponent(items_to_be_sended), encodeURIComponent(items_to_be_received), encodeURIComponent(trade_user));
    });

    $('body').on('click', '#deleteFriends', function() {
        var count = 0;

        for(var i in localStorage) {
            if(i.includes('friends_')) count++;
        }

        for(var i = 0; i < count; i++) {
            localStorage.removeItem('friends_' + i);
        }

        localStorage.removeItem('all_friends');
        $.ambiance({message: 'All friends have been deleted!', type: 'success'});

        $('.container').html(`

            <center>
                <h3>FRIENDS</h3>
                <h5>Here you can see all your user past trades as <b>friends</b> and <b>trade</b> with them faster.</h5>
                <h5>You do not have any friends yet ;(.</h5>
                <div class="friends"></div>
            </center>
        `);
    });

    $('body').on('click', '.item', function() {
        var go = $(this).attr('data-go');

        if(go == 'login') {
           OPSkins_Login();
           $('#LoginNow').html('<i class="fas fa-spinner fa-spin"></i>');
        } else if(go == 'trade') {
            view_trade = false;
            inventory = false;
            opskins_selected = [];
            $('.sidenav').sidenav('close');

            $('.container').html(`
                <center>
                    <h3>TRADE ITEMS</h3>
                    <h5>Enter your trading partner's <b>WAX Trade URL</b> or <b>SteamID64</b> to initiate the trade.</h5>
                    <div class="input-field col s6">
                        <input id="trade_with" type="text">
                        <label for="trade_with">WAX Trade URL or SteamID64</label>
                        <button type="button" id="submitTradeLink" class="btn btn-success btn-block btn-lg">Trade</button>
                    </div>
                </center>
            `);
        } else if(go == 'offers') {
            view_trade = false;
            inventory = false;
            opskins_selected = [];
            $('.sidenav').sidenav('close');

            $('.container').html(`
                <center>
                    <h3>TRADE OFFERS</h3>
                    <h5>Thousands of unique virtual items available for trade</h5>
                    <small>Please note: Trade Offers that are sent from verified sites will display <img src="data:image/png;base64,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" width="25"> or <i class="fa fa-check-circle text-success" style="color: #28a745;"></i> next to the account's name. Happy trading!</small>
                    <div class="offers"></div>
                </center>
            `);
            $('.offers').html(`<i class="fas fa-spinner fa-spin"></i>`);
            socket.emit('user offers');
        } else if(go == 'inventory') {
            view_trade = false;
            inventory = true;
            opskins_selected = [];
            $('.sidenav').sidenav('close');

            $('.container').html(`
                <center>
                    <h3>INVENTORY</h3>
                    <h5>Here you can see all your items from WAX ExpressTrade Inventory</h5>
                    <small id="your_inv_total_value">Inventory total value: $0.00</small>
                    <a class='dropdown-trigger btn' href='#gamePicker' data-target='gamePicker'><img src="https://opskins.com/images/games/logo-small-vgo.jpg">&nbsp;<i class="fas fa-angle-down"></i></a>
                    <ul id='gamePicker' class='dropdown-content dropdownul2'>` + $gamechanges + `</ul>
                    <div class="see_inventory"><i style=" margin: 75px auto auto auto; " class="fas fa-spinner fa-spin"></i></div>
                    <div style="margin-top: 20px;">
                        <button id="withdrawto_opskins" type="button" class="btn">Withdraw item(s) to OPSkins</button>
                    </div>
                </center>
            `);

            $('.dropdown-trigger').dropdown();

            inv_appid = 1;

            socket.emit('user change inventory', inv_appid);
        } else if(go == 'logout') {
            localStorage.removeItem('state');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            socket.emit('logout');
            window.location.href = '/';
        } else if(go == "friends") {
            showFriendsToTrade();
            $('.sidenav').sidenav('close');
        }
    });

    $('body').on('click', '.logout', function() {
        localStorage.removeItem('state');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        socket.emit('logout');
        window.location.href = '/';
    });

    $('body').on('click', '.container .your_inventory .item', function() {
        var $id = $(this).attr('data-id');
        if(view_trade == true) return;

        var count_1 = selected_items_to_send.length;
        var count_2 = selected_items_to_receive.length;
        var fcount = parseInt(count_1) + parseInt(count_2);
        
        if(selected_items_to_send.indexOf($id) == -1) {
            if(fcount >= 100) return $.ambiance({message: 'You can make a trade with maximum of 100 items at once!', type: 'error'});

            $(this).addClass('selected');
            selected_items_to_send.push($id);
        } else {
            $(this).removeClass('selected');

            selected_items_to_send.splice(selected_items_to_send.indexOf($id), 1);
        }
    });

    $('body').on('click', '.container .his_inventory .item', function() {
        var $id = $(this).attr('data-id');
        if(view_trade == true) return;

        var count_1 = selected_items_to_send.length;
        var count_2 = selected_items_to_receive.length;
        var fcount = parseInt(count_1) + parseInt(count_2);
        
        if(selected_items_to_receive.indexOf($id) == -1) {
            if(fcount >= 100) return $.ambiance({message: 'You can make a trade with maximum of 100 items at once!', type: 'error'});

            $(this).addClass('selected');
            selected_items_to_receive.push($id);
        } else {
            $(this).removeClass('selected');

            selected_items_to_receive.splice(selected_items_to_receive.indexOf($id), 1);
        }
    });

    $('body').on('click', '.container .item', function() {
        var $id = $(this).attr('data-id');
        if(view_trade == true) return;
        if(inventory == true) {
            if(opskins_selected.indexOf($id) == -1) {
                $(this).addClass('selected');
    
                opskins_selected.push($id);
    
                if(opskins_selected.length >= 100) return $.ambiance({message: 'You can send maximum 50 items at once to OPSkins inventory!', type: 'error'});
            } else {
                $(this).removeClass('selected');
    
                opskins_selected.splice(opskins_selected.indexOf($id), 1);
            }

            return;
        }
    });

    $('body').on('keyup', '#trade2FAcode', function() {
        if($(this).val().length == 6) $('#tradeItemsNow').prop('disabled', false);
        else $('#tradeItemsNow').prop('disabled', true);
    });

    $('.sidenav').sidenav();
});

function addNewFriend(avatar, name, trade_link) {
    var count = 0;

    for(var i in localStorage) {
        if(i.includes('friends_')) count++;
    }

    var already_friend = 0;
    var all_friends = [];
    if(localStorage.getItem('all_friends')) all_friends = localStorage.getItem('all_friends').split('<||>');

    for(var i in all_friends) {
        if(all_friends[i] == name) {
            already_friend = 1;
            break;
        }
    }

    if(already_friend == 0) {
        localStorage.setItem('friends_' + count, encodeURIComponent(avatar) + "|" + encodeURIComponent(name) + "|" + encodeURIComponent(trade_link));

        if(!localStorage.getItem('all_friends')) {
            localStorage.setItem('all_friends', name);
        } else {
            var all_friends = localStorage.getItem('all_friends');
            localStorage.setItem('all_friends', all_friends + "<||>" + name);
        }
    }
}

function showFriendsToTrade() {
    var friends = [];

    for(var i in localStorage) {
        if(i.includes('friends_')) {
            var itm = localStorage[i].split('|');
            friends.push({
                avatar: decodeURIComponent(itm[0]),
                name: decodeURIComponent(itm[1]),
                trade_link: decodeURIComponent(itm[2])
            });
        }
    }

    var $html = "";

    for(var h in friends) {
        $html += `
                <div class="friend">
                    <img src="` + friends[h].avatar.split('.jpg')[0]+"_full.jpg" + `">
                    <span class="name">` + friends[h].name + `</span>
                    <button type="button" class="btn makeOfferFriend" data-trade="` + friends[h].trade_link + `"><i class="far fa-plus-square"></i>&nbsp;TRADE</button>
                </div>
        `;
     }

     var $delete = "";

     if(localStorage.getItem("all_friends")) $delete = '<h5><button type="button" class="btn" id="deleteFriends" style=" background-color: #a62626; "><i class="fas fa-user-slash"></i>&nbsp;DELETE FRIENDS</button></h5>';
     else $delete = '<h5>You do not have any friends yet ;(.</h5>';

     $('.container').html(`

        <center>
            <h3>FRIENDS</h3>
            <h5>Here you can see all your user past trades as <b>friends</b> and <b>trade</b> with them faster.</h5>
            ` + $delete + `
            <div class="friends">` + $html + `</div>
        </center>
    `);
}

function OPSkins_Login() {
    window.open('/auth/login', '_self');
}

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 15; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

var getCookies = function(){
    var pairs = document.cookie.split(";");
    var cookies = {};
    for (var i=0; i<pairs.length; i++){
        var pair = pairs[i].split("=");
        cookies[(pair[0]+'').trim()] = unescape(pair[1]);
    }
    return cookies;
}