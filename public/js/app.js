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
                    <a class='dropdown-trigger btn' href='#gamePicker' data-target='gamePicker'><img src="data:image/jpeg;base64,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">&nbsp;<i class="fas fa-angle-down"></i></a>
                    <ul id='gamePicker' class='dropdown-content dropdownul'>
                        <li><a class="gameChange"><img data-appid="1" src="data:image/jpeg;base64,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">&nbsp;VGO</a></li>
                        <li><a class="gameChange"><img data-appid="12" src="https://opskins.com/images/games/logo-small-stickers.jpg">&nbsp;WAX Stickers</a></li>

                        <li><a class="gameChange"><img data-appid="7" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALlgAAC5YBCBN1fQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAbWSURBVFiFtZd7UJTXGcZ/59tdbrvcQUQRuS0gi6AVFLVW0aitWCfRdIyZjtrYJjNOm3am00l6s/c2SadqOx3TaDJpyTjWlNqoEGW8RCIGSElFU5CLARGQ5SIIyy57/U7/WEFgF2Wc5vlvz/vs+zznm/e85z2CGUK2yDAkRUjWArlAEhBxP3wPuAXUAReRlIlMYZlJXvFI4RsyHQ0vofIMgpCZucWG4BgeXhVZouWxDMgOGYyNXwHfBbQzEvaFC8lBAtknkoV9xgZkgzSi5QSS7McUnopqPGwVWaL7kQZki1yMSjkQ+38SH0MnkiKRKa5Pa0A2SCMarnwO4g9MuMkXJmEeW1DGxdtkEBr+8TmKAySgo1R2yGAfAzj5Nd7jNY4zlYcprTiE0+V4LLWPrr1HyYWf0DvQ9WBRsgQbL4/9FHD/qCnUM6XaT1Z8m8JVkZw6a+OJ/BeZHTuf9q5WqurKcct7SGklIBBcTgVVBpBrXEdu5nLcHjfvXfwDi5cMEx3i4ur1xRQu3TEx9QhujMIkzF5BDS8hfY+aw2LB2WXh6U0JnL28n9tnnGSkh/HUtggCAxUgdJyrqpLaq8c59G4xSC3Pfi0SBvpprhtg9qzNU1Mb0LEP2KvIFhmGyjP+PqFGOwupqtz97Ba3WprZvjmAjRuj7otPhqIIli6J54Xn5hMWPkhjbTMuq41bfSrGxOW+ySU7ZaMMVZAUTdfhDAYjNrvKmZoBnlwTR1xSvD/aZNMawde3L6Shy83AsAuhhKPV6vxR9Qg2Kfd7u1+Y0jZwqnoUjz6LawPZnCgf4e6A34bm3ZSUnK8c5OQFiE5cxolaHULzUNNrtUyp/IkYsPSTu3IPxmET+rxw7LUWzlUfZ/NqOwZ9gA//9PlBCpa/iHIDCBKs2f0N/n769YcZyFGA5Omi9V3/IbFhPu9cO8Kowc4bJQfYOG8XFTUjPlyr1UVwRC53Dn5Gk6GJkRQbn/z8QwpWbqC1s2k6iRQtEDZd1I0dc9cdztWUcq6iFIDd159Hxht8uF1mC0mpuXzSWcFff/omWq0Wk9vEz/R/5HLzRVISMvxJhPuW89iObCPYLD0kmlJJ1qQCsCXsKaLWzgHV6sOPj9PT0V5PUmwaqkficDhYEbeadsdNus2N08mgBYaBmKmB8spDxAe20ZvTzW/3/on+5h4S1iVT3lDM2nzvoTH3jNDTZyMzPZpQQyCD5loWfe/7HCh+HYfLTurTJsquHkBV7KiqiqL47HdIyCb5MZA/cbW1s47K6l/wlXwDN8yBDCjpKNpgrEM9pCZYmZdgQErJnu+U4XarbNuSyY5tJoaGHVT+ewhDRAqgQXWa+fJqA739Nqo+CmH7xh9PNVAtZJM8DHwLwOly8M7JHxHITVYtNBASpKDTh9DtCcPtVvF4JB1dw3R1W9j9bA7tHcO8sv8Kbx/6KqfOtjA0bGeBMRqtTkNwkI658QYM+gCcLg83Wwe5VDHC+mV7MSYt9MpL3lCAi2N2dNoAMpNXYXUlc6SsF4DbHUMYk6NIT4vG7nCTYYzihV2LaW2/x9F/9bJ+yy7eKq5j/Zpkdmw14XSqhOoDyEiLwun0MDTs4Pp/B3m7+A4x4dlER07qCxe0uClFixXQCyFYueRJzleVYEoMoKXTRtrcEKTDhkPqKMibS1+/jcqaTv55upG7t3XI3jo+7bxJTEwICXPCyPtCPHa7G4CoyGBsoy4cdggIdLN8URFR4ePlZsXDGe9t2CTfBPaMRVxuJ+a+Lsqv/J6VxgHi50YQnpKEEA/ml/fPtvLhYSd5rmVUzitl/5+/iKJ441LKce7fjvaQl7mTmMg44qIn7f6IyBDPew14J6F6YFLTVlUPfzm2g8JsheTsJIKiIidV0B2zhdb2e6zITxgXn4jjJd3kpj1HZnLO1JATwQKRLlrH/yUb5WsIfjCV6XaPcuT4HvJSXeQUpBMYPm3fepDd5eHYux3kL/gmWalL/FFeERnihzBhJpRtMggnHwAFU9lSSkov/YYecw2b1s0nPmUuQuPbw6QquVzTSVOjwtZ1LxMdPsdXWlKFhkJhFI5JBgBkvZyNlo+Bef5sj9j6KLt0kCFLG3qDhllxoYTog+jrdzJ0T4KMID+7iKyUFdN9nDvAUpEhxmc037G8UeYgKAMSpssC3kK9O9iH3TlKdEQsofrwh9EBOlApEgvEpxMX/T9MWmQsKiXAlx6VdUaQVOFh68RxfAx+LyNhFH0obAB+CfjePDOHE/gdGgr9icNMHqf1cjY69iHZCehnKGwFjiJ4VaSL1ocRH2lgghEDWoqQFCJYhHeQmfg8b0NyFfgAD+8Lk/CdWvzgf8CVqLviXNLXAAAAAElFTkSuQmCC">&nbsp;CryptoKitties</a></li>
                        <li><a class="gameChange"><img data-appid="8" src="data:image/png;base64,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">&nbsp;EtherBots</a></li>
                        <li><a class="gameChange"><img data-appid="9" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQyIDc5LjE2MDkyNCwgMjAxNy8wNy8xMy0wMTowNjozOSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjhBODMzMTVEODkxODExRThBOThCOTBGMjBGRDIyRTlDIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjhBODMzMTVFODkxODExRThBOThCOTBGMjBGRDIyRTlDIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OEE4MzMxNUI4OTE4MTFFOEE5OEI5MEYyMEZEMjJFOUMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OEE4MzMxNUM4OTE4MTFFOEE5OEI5MEYyMEZEMjJFOUMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz401KyjAAAFuUlEQVR42uyWeVDUZRjH39+x98Euyx7swq6wooaoQAIqoySogyGNIyLkjImUGmmjOUnHmFlTYp55TnkOpRiJlKbiyJFgyqEg4EoccixLu7Dsssuy9+8KxxmcGsyj7C+/f7/v5/s+73zf93kgiqLA8xQMnrNeGDxW6JMs0g0YC1quV9m1OABqhigtOCZCMRaGnuhw0D+n6PfBnv3Osp86mgYcbD8So+EYSWIIRoxDRUn+EUtCY2Vc4bMbnLxQkUOVWwWw10EPCjAbMY6VYjoRBuYGMO72wwb8B4mswIS3wuchMPzUBicKS3ecqfKj2I33FNtX52XG/lLTIkdU3J5BVhUSWOcbXI0rHSRNYdeHOThfTFkyVR7yFAb1rbrU9V+TqNJGD1s4sfTIyhxdLUcoRLkcwtLqEgZDTpxW2S8/poo7zYzmuCwSnT5HlZIWHvdg+zCTIHAUpY2eIor07NmWca9oP/PeHuvt8ysSyoaz0I/zCX++Rs81SSVmjrzLwEkQG/K8x0+1f0NDmL1Bqk2dhcXdmgcEfctRArc9Mqb1dYdKz5a9kQ7drrFf/HTf4UONnTqZejyM2Sk6A4hkiGMQo/mgFrFfu0W2lF1/jdwLPKhB5V851HWfbrjJJo8zmL6jX5G21/LlBt8jp4G23l85ng1s7to6IpDp5fkzrXaITgMkBUiCQlGIIABJQhATkTq1Z/HwxYws96QMQGHLLdnHDYXscMPoFdyoOZq1MuWD7PV0DHN02Hq1IHIsqFVM7PMwGQAnSGgYisAQQQ47QQhKQV7cSFOm+Nb/xoRhCBTq38tnRjUjAmd/0ygG3YYBg01Z0zRTr+8ZIpMh2M5CCCuO7uxUG/twLhthUZgUMvoBs4Q0yRjmYSJODRNIMATdZYDP+7K7KR1wKt6RJSOGt/9uMGDD1m7PTU/QnCks/f7kVYeLzWKjECBwvo/5Rg9usNIEFI3CtmKJK7zpn3AW5FhnmxxMEcsjIfsP8OevlsnuAMLfSzAZvXPdWq/ww4dfhceLaVq6Soq/27kwV87UZS57N3N5eHjwsd4+mgil+hFWX6sFF7iB1pMKv3mBP4MG92M9UqShPfOlCqOdEcjxnOPIgUZ7mZREuppl1ppF1pv0GXsfVlDVdmdt47aQVSXj4jCAcLds3V9bvh3IMJzi0RCvyYUM/QHRIQhyA/WgATS5sAqMVdVWIM3jQF4UcdU0qyaUGcfwOqZjjbzB/i67cg14RV+d9LCCCIX6467UU5vLPxM3V3xkifItLyr27KL5+DA8ALJprAIx1B0S5LHB/PlmTbtOmCjUJEzqkLKcZorNoWEL81cSBu9Ghisx9rWDZC5g8ESYmQbPASOvbkSVldVJm1OX5cYDkfBANpNy+ZBUZFDeqshopbVa2XzJr+m8n7sUJUpRwyVu3Tk5dRfs+CoeTN2jfHVDxPyDw4RWSyfcuGVzyVS7vuEB8y8pmjYt+sSaA/VXfHjr4tZ2x6aWzY4qju/M/rnJtKzaOCXEzwQzGG1WQTddMsQSKrmmAVy09+osKc/gy2WLxtEJggwRjMmXLRXjXojOGf0diCWSin3HQkuN4PqtgqSy2nk7RVZ64Nw5BZUBOA6kCgjloQ4rGaT2iJTe13en6E2IQgIBtmRRrBpB7tMWi0NiBEsc9uZHfhUCX+GvRSUZsxYBYGPxA5TJq+T0jh8b4/NuTxdAPRPkrkDEjMLGdT+kXalWh6ncgO0fNVaUkTxjhBDx8kamMOrx/SD/4rWjRfU6fR+EO/pAdErorW/Td9cKJmO4J3fTxMM1sybHDsVHTEiODY2PCX3Gjmazuy6W36y923G5pkeFOIITmw4FT+cHsJwNnrRW8ZrE2THhY/5VyxyRw+k2GK12jzXz6qkOhjdgAb+Cs86XxX38TuoppTUb5bvez8o//ITroWcYHS+3NXBIZOb4sP9gqngx2f0PBn8KMADVJxhhBGpvyAAAAABJRU5ErkJggg==">&nbsp;FishBank</a></li>
                        <li><a class="gameChange"><img data-appid="11" src="data:image/png;base64,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">&nbsp;CryptoBarons</a></li>

                        <li><a class="gameChange"><img data-appid="2" src="data:image/jpeg;base64,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">&nbsp;CS</a></li>
                        <li><a class="gameChange"><img data-appid="3" src="https://steamcdn-a.opskins.media/steamcommunity/public/images/apps/578080/93d896e7d7a42ae35c1d77239430e1d90bc82cae.jpg">&nbsp;PUBG</a></li>
                        <li><a class="gameChange"><img data-appid="4" src="https://steamcdn-a.opskins.media/steamcommunity/public/images/apps/433850/a7a0cef96f9cf83f4afd7cb52a48174f2dfbb663.jpg">&nbsp;H1Z1</a></li>
                        <li><a class="gameChange"><img data-appid="5" src="https://steamcdn-a.opskins.media/steamcommunity/public/images/apps/440/e3f595a92552da3d664ad00277fad2107345f743.jpg">&nbsp;TF2</a></li>
                        <li><a class="gameChange"><img data-appid="6" src="https://steamcdn-a.opskins.media/steamcommunity/public/images/apps/570/0bbb630d63262dd66d2fdd0f7d37e8661a410075.jpg">&nbsp;DOTA2</a></li>
                    </ul>
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
                if(itm.is_case_opening) $case_opening = '<img style="width: 25px; height: 18px;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAAyCAYAAADlaH1uAAAOA0lEQVRogeWbeXzU9ZnH39/fHMlMZpIJCYlAwg0KCIiAB1QL6tKutNa6iruseJSyFg92EatdWavY4oXsawtSTRE1HCrCUn3ValV0bcshckgCkSCXBMg9gTCZHJOZ37N//ObOTDIh2e5ru5/X63llft/7+fye7/N8j1/U+KKDdAEzSv0Z6APosVkCAihlAjyIzADcACalOOTxcbkrnT/cMQKH1dRVP53iiLuNa9YfJstqwmZW0VmzgSeBQMy4iC4jdhHeUvCoSSn21Xp57Kp+PHXdAEwqpi3MKYzFj8iHKJ6I7QSjUyXBPgUULwD3hIbU0tLOghkDe0wGwIicNG4ZnsVLJXVMzLPjFwllrQCVEyEhlB77rOBNs1Lsdbfwrf4Oll5fkLAfLcXxPAnKjQQtAomS4LPB1d1AJkC5p43rB2Yy69I+KXbRNX46pR8Z6SbO+wKI0f3tQI6RG3pZKvJbBERhQm3WlNq/t64Zm1Wj+OahSfsw1Vz7Y2raAp2LL4DTrJ3LMJu+r8e3EP0iFIDKNSvtdxXuVp6+roBL82y9xQfZNhNnz/t57/g5ChxWdNSnKJURGQggIatVoMCiaVS1+GccaWjx3H5xNptvGc6w7LRQk6OAK4EWjCnXX81/75suBxLQhU8qPBxr8Z+8LCttoE+XpGU1BQfP+3Km9bU1bJ1zMSYtfpr1DIfrWxlXfIhBdsusdJPaGHob8b2YlEIXKGlo2ZBvN9/x5NX9+MnkvPjmrgQmADbgGuATJZJcuWjsrfQy7/cnv/NlfcsfsmyG61EiiFIgBhEiQptAy7nWVz+YM2rud0dk9UT3pPjXj0/z7Ccna8m19zVSJNbdS/A5IJW3XeIa8NwNhQxxpSVqKoQs4O+A/0yVkFuB+a1+3b/jVNMMh9XU4Y2EENAFk6aYPCDjvwAf0BTMSsVUFIYqHgwTTuTj2t3NgcEfHD03IzPNcNYa0OzX8QUEwyAVze0BcmyWIz8c5XoVyEvQvwY0ByUQ/OtPlZAmICOVgv/H8UoqUeYu/n+Q4QHmpULIC//TI/lLwNfeThez4UHoemE2D8iNTwwEAvzil6vYtWs/Pp8Pi8UCgCBoSkPXdc6f9/Cje2Yxb97tHRrdsXM/Jg2uvPKyDnkrVhTz8dZteL0tWK1mQAUXw4bTbmz0cPMPZvCzR++lvPwYd9y5CFeWE7M5sSqapjh58gxXXDGeNa88i1IJXdkZoNhQQiSZaCJSJXFoaW2V6264S0ATsAv0FegTlByBXMl0jRdwyajRM+Kry969B8VkHiTvvLu1Q96P5i4WsAhYBXLj2s2RjMyxAhdJ4cCpIiIy585Hg2VDZfokEIcAUrz2tx36i8L3Qnp3ZiH3AxfFJ656cQOfbi1m9JgZLHjwbvr1z8Pf7gfAbDZzsOxrFj+2BDjHrFk3xtQ9cPAwU751KwG/jyGDB8TkvfnW73h1zTP06z+ZRx65lyFDBhLwBxAEs9nM6VNVPPDA40A1ixY9Q2Ojhzc2rGP4iKksWbIQu92GHggQPyna2nxkZTqZOXNaMj33A++FnzqxkOp4Gmvr3NK37+WitH5SWlqelO5frSiW55cVSeN5TzitpORrQRsmMFjy+18tu/eUhvPa2nwyaswMgdxO29349vvy9NMrRETk3vn/JoB8+NG2zt58KpgmUXons5DZQH584sqV66mr28fCh55h7NiLkzHOggfvjHnes7ecyZOux+7IZtzYS/iq/GjMouDlojc4VLafgoGXsnPnlxw+fJx2f2Tz6vf7MWkas2ffBEDpgcMUvfQSgwZPo6qqlo0bf48edJhmk4mKikqmTL2cq6+akHSMQWwFPotJkcTW4Y6nsa7OLTk54yXdNkyqa+pSpv/AgeMCThk46CopLz8m13z778VqGyUlJYfCZSZNvlnAIa4+E4K+I1vAJZAl0F+s6ZcImGThQ0tFROSWWx8UKJTs3IkC/aLKu8TYyDhk1679qQzvknjdE1nIPRhnHzF4YflruN0lLPjnpeTndQg8CVFS8jWTJn+bocNGcezoTgC+OXEKTSl0PbLWXrr0YR5/XOFyZaJplyEiKKXQNIXbfY66ukaOH2tg3LhLqKysYcvmTQwZejGjx4wg4B9nhNPgBvObb05z3/1zuOKK8V0NbxNQ3iE1gXWcjKexts4truwxUlA4McYvxOP48aNy5MgJERH58ssycThHSpZruOwvOSIiIqWl5TJk6LVic4yR8vJjIiJy+nSHQBaD3XtKxWwplLx+V4qILvfdv0RAybr176RiAZ0hTxLMjviEuYlqPrRoqYAms//xYdF1XZqavDFSXn5Mvvu39wjY5aOPtkl1dZ04ssYKFMj4y26WKVNvk+Ejr5Ohw6fJ4CHXSl6/K8Tj8cr7738mmqm/TJl6q3g8XhER0XU9LHX1DXLvTwznuerX66WqqlYgWyZOulm83mYJRJUNiYjI2bONUlNT3xkZGxKRISLE72UqgMLohKNHTzJ+wkxcWU6cDgdp6VaUpkWOY5Sips5N5akd/OCH8/n35T9n4qQbOddwhkGDR+NtbqLJ24xSCpNJIysrkyyng+LXn2fhQ0vZtmM3eXl96ZvTB7MleLImoDSFt6mZI1/vZPjIKRw5vJV5//QYr6xey8RJk7BYzbS0tMZYu8LYXB4/XsHGN1cwc+b0ZNOlAGMx1gHRPmRuPBlgeHhdFyrPVGFJt9He2gQx0d4PmJh/38+ZPu0qhg+/DEdmPtu2fUCWy4Gu6ygUSilOnDjNTTfdRY3VjtI00tPTINBMY6OH2qoqYvfwOuDn6qkzefe3RXz2x895ZfWzWG2jKTlQjr+ticQ4w9RrZnVGxnPJyABiLKSe8HFcLA4cOMzBsiM4HHZU1PGYILS1+cjp42L69Kv44osStm//E3Pm3EFubnbCDrds+RB/IMCs227kzJlq/vTn3TgcGcF2I/C1t2OxWPj+9wzFPvvjF5w4for8/NwYhxwNQTh39jw3/M1U+l3UN1GRdoyAkYzNMCF3A68lK/RXhJ/SxWY1RMh5wPmXGNH/IloAe1eFNOAJ/vrJAGNv1iWUiFwLWDEcQzoGi4FOaxnQg2XtxHpD36cnzk95u6xhfn+nldCKSRdIM4HNoiECrX6dNJN26J4Juc9n28wugLLaFv875eeet5qwaUphMSnSzcaRTcjD6ALnWv3MHpf7y8JMS/w4tShdwjoCbRgvPiVCUinXLYwrOsiBU54KnNbCDkeZ0f359Lqx+fa8ld8ZyOnzPu7+uOJSf4u/BHMwrkdf/UCQWwF3a/H86YV3/3rmoF4fe68T8taBBv7h3eNMyLfP00V+E7yrIaJZJEpZlOKk17emXZcfA7isppocqynPOEyILh/73OwPFFS3Bs6UzR1DYaalV8ef6s1dSggILPu8mmyHBYHVKE5FcqMVM3636zoFdsvc/jYL/W3mKdlWU55fJKpMNJHhNlY7zaYzntYAy7dX9ebwgV4mZHNZA/tqvAzJsIRuVBd3tA4V9ajQESwm9aJFU0t0xDgrjJlmKvavyFMBYIQrjV+V1VPR2N6bKvQeIa1+YdnOanIc1uh3ug6oBCK+QyRyQR7B/Sh1Q0eLiIe8LHBaRHCaNfDpLNte2VsqAL1IyKayBvZWexmUYYn/ZuJfOpaOuozucGOfCGGTWqyUsQ0IAKP62HjxoJvy+tYk9bqPXiOkaF8NGRlmAnTYQW5CqIraDRp/w1xEfIqht0rGyxtAQ3SCzaTAL7y8u7a31OgdQjZ/dZbtlc2MdFgBQ+doQfFUjF8ITxsVul8gXDEekSi4OD4rAIzITmPt4bOc8fSOL+kVQp7bUYXTbg4qRyJ5GYiEhHAojodE8kPfohhtvi4i3yQ6v3CaNc62tLN8e3VvqNJzQjaXNbCnxstwhzV80JsQIo8lnAsisdMompSg8xXFE+EoHCcBhBGuNFaW1XPsbFtP1ekZIe0B4dmd1WRlGFOlw1yJlddB1Ua+QkqCcF54HbJGCRUqOMviBYFMswl/cztbvmpI2myq6BEhWw6dZW+Vl2EdI0syLDT0jJouKirKxCxKQ2Gan3XVqF+EAa501pc10Nye4kiS4IIJ8evCf+yqwemwhA5nU5E3QJ2NbSku5CoVFYllLaj6LiwPlCI/3UxpbTNvH+yZlVwwIRtK3Xxe2cRIZxp6CgOOhBwWxMyZUKgNh9voiKMWpvSZTbBWvtPKsi+q8bSlsllPjAsmZNWeOlwOC/7kV6HJZD1CVawjSRh2XwdpSBa24kVHKMyw8FVNM+tK3Beq1oURUry/nt01XgaH1x2qW4JSjxgtSZTfiNndCvBwwrDSiQQELnKlUVRST1vgwnbx3SbErwsr99SRndGjbfd6UCeNn0FGws5VQGQNIu4U/VJYdBEG2CyUVnv5zZ4LW712m5D3Djeyt7rJ2NF2c8AxEj7Big7DwbfdybqjK9GB/Cwrq0vqabmAiNMtQgK6sHxXFTa7mQCpzu4kIlIMqtH40DZIjIG3CO2QLwA6QoHNwoGaZjaVdT/idIuQDaVutlV4GOVM6+p7rZQgIgsiy/jwDviBnjENugj5mVZe2FVNk697EadbhBTtq8XltBIIfjncC7IWpC7iUGU9CndPG9UVFNgNK9lQ2j0rSZmQdSVudlR6GeqwhlffvSGgHg2vxIRFvdWwX4S+WWkU7avtVsRJmZBVu2txZlhSup/oDkTkteC02Y5StSkv8FKQgXYLX9Y0U9SNiJPK/8uwZl89u+q8TMi1oyMJjy16BrkX4eveblVXimF90ikudVNe15JSnf8G35+PvTMIp/0AAAAASUVORK5CYII=">&nbsp;';

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
                        <div class="name">` + itm.market_name + `</div>
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
                        <div class="name">` + itm.market_name + `</div>
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
                        <div class="name">` + itm.market_name + `</div>
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
                <small>Please note: Trade Offers that are sent from verified sites will display <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAAyCAYAAADlaH1uAAAOA0lEQVRogeWbeXzU9ZnH39/fHMlMZpIJCYlAwg0KCIiAB1QL6tKutNa6iruseJSyFg92EatdWavY4oXsawtSTRE1HCrCUn3ValV0bcshckgCkSCXBMg9gTCZHJOZ37N//ObOTDIh2e5ru5/X63llft/7+fye7/N8j1/U+KKDdAEzSv0Z6APosVkCAihlAjyIzADcACalOOTxcbkrnT/cMQKH1dRVP53iiLuNa9YfJstqwmZW0VmzgSeBQMy4iC4jdhHeUvCoSSn21Xp57Kp+PHXdAEwqpi3MKYzFj8iHKJ6I7QSjUyXBPgUULwD3hIbU0tLOghkDe0wGwIicNG4ZnsVLJXVMzLPjFwllrQCVEyEhlB77rOBNs1Lsdbfwrf4Oll5fkLAfLcXxPAnKjQQtAomS4LPB1d1AJkC5p43rB2Yy69I+KXbRNX46pR8Z6SbO+wKI0f3tQI6RG3pZKvJbBERhQm3WlNq/t64Zm1Wj+OahSfsw1Vz7Y2raAp2LL4DTrJ3LMJu+r8e3EP0iFIDKNSvtdxXuVp6+roBL82y9xQfZNhNnz/t57/g5ChxWdNSnKJURGQggIatVoMCiaVS1+GccaWjx3H5xNptvGc6w7LRQk6OAK4EWjCnXX81/75suBxLQhU8qPBxr8Z+8LCttoE+XpGU1BQfP+3Km9bU1bJ1zMSYtfpr1DIfrWxlXfIhBdsusdJPaGHob8b2YlEIXKGlo2ZBvN9/x5NX9+MnkvPjmrgQmADbgGuATJZJcuWjsrfQy7/cnv/NlfcsfsmyG61EiiFIgBhEiQptAy7nWVz+YM2rud0dk9UT3pPjXj0/z7Ccna8m19zVSJNbdS/A5IJW3XeIa8NwNhQxxpSVqKoQs4O+A/0yVkFuB+a1+3b/jVNMMh9XU4Y2EENAFk6aYPCDjvwAf0BTMSsVUFIYqHgwTTuTj2t3NgcEfHD03IzPNcNYa0OzX8QUEwyAVze0BcmyWIz8c5XoVyEvQvwY0ByUQ/OtPlZAmICOVgv/H8UoqUeYu/n+Q4QHmpULIC//TI/lLwNfeThez4UHoemE2D8iNTwwEAvzil6vYtWs/Pp8Pi8UCgCBoSkPXdc6f9/Cje2Yxb97tHRrdsXM/Jg2uvPKyDnkrVhTz8dZteL0tWK1mQAUXw4bTbmz0cPMPZvCzR++lvPwYd9y5CFeWE7M5sSqapjh58gxXXDGeNa88i1IJXdkZoNhQQiSZaCJSJXFoaW2V6264S0ATsAv0FegTlByBXMl0jRdwyajRM+Kry969B8VkHiTvvLu1Q96P5i4WsAhYBXLj2s2RjMyxAhdJ4cCpIiIy585Hg2VDZfokEIcAUrz2tx36i8L3Qnp3ZiH3AxfFJ656cQOfbi1m9JgZLHjwbvr1z8Pf7gfAbDZzsOxrFj+2BDjHrFk3xtQ9cPAwU751KwG/jyGDB8TkvfnW73h1zTP06z+ZRx65lyFDBhLwBxAEs9nM6VNVPPDA40A1ixY9Q2Ojhzc2rGP4iKksWbIQu92GHggQPyna2nxkZTqZOXNaMj33A++FnzqxkOp4Gmvr3NK37+WitH5SWlqelO5frSiW55cVSeN5TzitpORrQRsmMFjy+18tu/eUhvPa2nwyaswMgdxO29349vvy9NMrRETk3vn/JoB8+NG2zt58KpgmUXons5DZQH584sqV66mr28fCh55h7NiLkzHOggfvjHnes7ecyZOux+7IZtzYS/iq/GjMouDlojc4VLafgoGXsnPnlxw+fJx2f2Tz6vf7MWkas2ffBEDpgcMUvfQSgwZPo6qqlo0bf48edJhmk4mKikqmTL2cq6+akHSMQWwFPotJkcTW4Y6nsa7OLTk54yXdNkyqa+pSpv/AgeMCThk46CopLz8m13z778VqGyUlJYfCZSZNvlnAIa4+E4K+I1vAJZAl0F+s6ZcImGThQ0tFROSWWx8UKJTs3IkC/aLKu8TYyDhk1679qQzvknjdE1nIPRhnHzF4YflruN0lLPjnpeTndQg8CVFS8jWTJn+bocNGcezoTgC+OXEKTSl0PbLWXrr0YR5/XOFyZaJplyEiKKXQNIXbfY66ukaOH2tg3LhLqKysYcvmTQwZejGjx4wg4B9nhNPgBvObb05z3/1zuOKK8V0NbxNQ3iE1gXWcjKexts4truwxUlA4McYvxOP48aNy5MgJERH58ssycThHSpZruOwvOSIiIqWl5TJk6LVic4yR8vJjIiJy+nSHQBaD3XtKxWwplLx+V4qILvfdv0RAybr176RiAZ0hTxLMjviEuYlqPrRoqYAms//xYdF1XZqavDFSXn5Mvvu39wjY5aOPtkl1dZ04ssYKFMj4y26WKVNvk+Ejr5Ohw6fJ4CHXSl6/K8Tj8cr7738mmqm/TJl6q3g8XhER0XU9LHX1DXLvTwznuerX66WqqlYgWyZOulm83mYJRJUNiYjI2bONUlNT3xkZGxKRISLE72UqgMLohKNHTzJ+wkxcWU6cDgdp6VaUpkWOY5Sips5N5akd/OCH8/n35T9n4qQbOddwhkGDR+NtbqLJ24xSCpNJIysrkyyng+LXn2fhQ0vZtmM3eXl96ZvTB7MleLImoDSFt6mZI1/vZPjIKRw5vJV5//QYr6xey8RJk7BYzbS0tMZYu8LYXB4/XsHGN1cwc+b0ZNOlAGMx1gHRPmRuPBlgeHhdFyrPVGFJt9He2gQx0d4PmJh/38+ZPu0qhg+/DEdmPtu2fUCWy4Gu6ygUSilOnDjNTTfdRY3VjtI00tPTINBMY6OH2qoqYvfwOuDn6qkzefe3RXz2x895ZfWzWG2jKTlQjr+ticQ4w9RrZnVGxnPJyABiLKSe8HFcLA4cOMzBsiM4HHZU1PGYILS1+cjp42L69Kv44osStm//E3Pm3EFubnbCDrds+RB/IMCs227kzJlq/vTn3TgcGcF2I/C1t2OxWPj+9wzFPvvjF5w4for8/NwYhxwNQTh39jw3/M1U+l3UN1GRdoyAkYzNMCF3A68lK/RXhJ/SxWY1RMh5wPmXGNH/IloAe1eFNOAJ/vrJAGNv1iWUiFwLWDEcQzoGi4FOaxnQg2XtxHpD36cnzk95u6xhfn+nldCKSRdIM4HNoiECrX6dNJN26J4Juc9n28wugLLaFv875eeet5qwaUphMSnSzcaRTcjD6ALnWv3MHpf7y8JMS/w4tShdwjoCbRgvPiVCUinXLYwrOsiBU54KnNbCDkeZ0f359Lqx+fa8ld8ZyOnzPu7+uOJSf4u/BHMwrkdf/UCQWwF3a/H86YV3/3rmoF4fe68T8taBBv7h3eNMyLfP00V+E7yrIaJZJEpZlOKk17emXZcfA7isppocqynPOEyILh/73OwPFFS3Bs6UzR1DYaalV8ef6s1dSggILPu8mmyHBYHVKE5FcqMVM3636zoFdsvc/jYL/W3mKdlWU55fJKpMNJHhNlY7zaYzntYAy7dX9ebwgV4mZHNZA/tqvAzJsIRuVBd3tA4V9ajQESwm9aJFU0t0xDgrjJlmKvavyFMBYIQrjV+V1VPR2N6bKvQeIa1+YdnOanIc1uh3ug6oBCK+QyRyQR7B/Sh1Q0eLiIe8LHBaRHCaNfDpLNte2VsqAL1IyKayBvZWexmUYYn/ZuJfOpaOuozucGOfCGGTWqyUsQ0IAKP62HjxoJvy+tYk9bqPXiOkaF8NGRlmAnTYQW5CqIraDRp/w1xEfIqht0rGyxtAQ3SCzaTAL7y8u7a31OgdQjZ/dZbtlc2MdFgBQ+doQfFUjF8ITxsVul8gXDEekSi4OD4rAIzITmPt4bOc8fSOL+kVQp7bUYXTbg4qRyJ5GYiEhHAojodE8kPfohhtvi4i3yQ6v3CaNc62tLN8e3VvqNJzQjaXNbCnxstwhzV80JsQIo8lnAsisdMompSg8xXFE+EoHCcBhBGuNFaW1XPsbFtP1ekZIe0B4dmd1WRlGFOlw1yJlddB1Ua+QkqCcF54HbJGCRUqOMviBYFMswl/cztbvmpI2myq6BEhWw6dZW+Vl2EdI0syLDT0jJouKirKxCxKQ2Gan3XVqF+EAa501pc10Nye4kiS4IIJ8evCf+yqwemwhA5nU5E3QJ2NbSku5CoVFYllLaj6LiwPlCI/3UxpbTNvH+yZlVwwIRtK3Xxe2cRIZxp6CgOOhBwWxMyZUKgNh9voiKMWpvSZTbBWvtPKsi+q8bSlsllPjAsmZNWeOlwOC/7kV6HJZD1CVawjSRh2XwdpSBa24kVHKMyw8FVNM+tK3Beq1oURUry/nt01XgaH1x2qW4JSjxgtSZTfiNndCvBwwrDSiQQELnKlUVRST1vgwnbx3SbErwsr99SRndGjbfd6UCeNn0FGws5VQGQNIu4U/VJYdBEG2CyUVnv5zZ4LW712m5D3Djeyt7rJ2NF2c8AxEj7Big7DwbfdybqjK9GB/Cwrq0vqabmAiNMtQgK6sHxXFTa7mQCpzu4kIlIMqtH40DZIjIG3CO2QLwA6QoHNwoGaZjaVdT/idIuQDaVutlV4GOVM6+p7rZQgIgsiy/jwDviBnjENugj5mVZe2FVNk697EadbhBTtq8XltBIIfjncC7IWpC7iUGU9CndPG9UVFNgNK9lQ2j0rSZmQdSVudlR6GeqwhlffvSGgHg2vxIRFvdWwX4S+WWkU7avtVsRJmZBVu2txZlhSup/oDkTkteC02Y5StSkv8FKQgXYLX9Y0U9SNiJPK/8uwZl89u+q8TMi1oyMJjy16BrkX4eveblVXimF90ikudVNe15JSnf8G35+PvTMIp/0AAAAASUVORK5CYII=" width="25"> or <i class="fa fa-check-circle text-success" style="color: #28a745;"></i> next to the account's name. Happy trading!</small>
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
                    <a class='dropdown-trigger btn' href='#gamePicker' data-target='gamePicker'><img src="data:image/jpeg;base64,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">&nbsp;<i class="fas fa-angle-down"></i></a>
                    <ul id='gamePicker' class='dropdown-content dropdownul2'>
                        <li><a class="gameChange"><img data-appid="1" src="data:image/jpeg;base64,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">&nbsp;VGO</a></li>
                        <li><a class="gameChange"><img data-appid="12" src="https://opskins.com/images/games/logo-small-stickers.jpg">&nbsp;WAX Stickers</a></li>

                        <li><a class="gameChange"><img data-appid="7" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALlgAAC5YBCBN1fQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAbWSURBVFiFtZd7UJTXGcZ/59tdbrvcQUQRuS0gi6AVFLVW0aitWCfRdIyZjtrYJjNOm3am00l6s/c2SadqOx3TaDJpyTjWlNqoEGW8RCIGSElFU5CLARGQ5SIIyy57/U7/WEFgF2Wc5vlvz/vs+zznm/e85z2CGUK2yDAkRUjWArlAEhBxP3wPuAXUAReRlIlMYZlJXvFI4RsyHQ0vofIMgpCZucWG4BgeXhVZouWxDMgOGYyNXwHfBbQzEvaFC8lBAtknkoV9xgZkgzSi5QSS7McUnopqPGwVWaL7kQZki1yMSjkQ+38SH0MnkiKRKa5Pa0A2SCMarnwO4g9MuMkXJmEeW1DGxdtkEBr+8TmKAySgo1R2yGAfAzj5Nd7jNY4zlYcprTiE0+V4LLWPrr1HyYWf0DvQ9WBRsgQbL4/9FHD/qCnUM6XaT1Z8m8JVkZw6a+OJ/BeZHTuf9q5WqurKcct7SGklIBBcTgVVBpBrXEdu5nLcHjfvXfwDi5cMEx3i4ur1xRQu3TEx9QhujMIkzF5BDS8hfY+aw2LB2WXh6U0JnL28n9tnnGSkh/HUtggCAxUgdJyrqpLaq8c59G4xSC3Pfi0SBvpprhtg9qzNU1Mb0LEP2KvIFhmGyjP+PqFGOwupqtz97Ba3WprZvjmAjRuj7otPhqIIli6J54Xn5hMWPkhjbTMuq41bfSrGxOW+ySU7ZaMMVZAUTdfhDAYjNrvKmZoBnlwTR1xSvD/aZNMawde3L6Shy83AsAuhhKPV6vxR9Qg2Kfd7u1+Y0jZwqnoUjz6LawPZnCgf4e6A34bm3ZSUnK8c5OQFiE5cxolaHULzUNNrtUyp/IkYsPSTu3IPxmET+rxw7LUWzlUfZ/NqOwZ9gA//9PlBCpa/iHIDCBKs2f0N/n769YcZyFGA5Omi9V3/IbFhPu9cO8Kowc4bJQfYOG8XFTUjPlyr1UVwRC53Dn5Gk6GJkRQbn/z8QwpWbqC1s2k6iRQtEDZd1I0dc9cdztWUcq6iFIDd159Hxht8uF1mC0mpuXzSWcFff/omWq0Wk9vEz/R/5HLzRVISMvxJhPuW89iObCPYLD0kmlJJ1qQCsCXsKaLWzgHV6sOPj9PT0V5PUmwaqkficDhYEbeadsdNus2N08mgBYaBmKmB8spDxAe20ZvTzW/3/on+5h4S1iVT3lDM2nzvoTH3jNDTZyMzPZpQQyCD5loWfe/7HCh+HYfLTurTJsquHkBV7KiqiqL47HdIyCb5MZA/cbW1s47K6l/wlXwDN8yBDCjpKNpgrEM9pCZYmZdgQErJnu+U4XarbNuSyY5tJoaGHVT+ewhDRAqgQXWa+fJqA739Nqo+CmH7xh9PNVAtZJM8DHwLwOly8M7JHxHITVYtNBASpKDTh9DtCcPtVvF4JB1dw3R1W9j9bA7tHcO8sv8Kbx/6KqfOtjA0bGeBMRqtTkNwkI658QYM+gCcLg83Wwe5VDHC+mV7MSYt9MpL3lCAi2N2dNoAMpNXYXUlc6SsF4DbHUMYk6NIT4vG7nCTYYzihV2LaW2/x9F/9bJ+yy7eKq5j/Zpkdmw14XSqhOoDyEiLwun0MDTs4Pp/B3m7+A4x4dlER07qCxe0uClFixXQCyFYueRJzleVYEoMoKXTRtrcEKTDhkPqKMibS1+/jcqaTv55upG7t3XI3jo+7bxJTEwICXPCyPtCPHa7G4CoyGBsoy4cdggIdLN8URFR4ePlZsXDGe9t2CTfBPaMRVxuJ+a+Lsqv/J6VxgHi50YQnpKEEA/ml/fPtvLhYSd5rmVUzitl/5+/iKJ441LKce7fjvaQl7mTmMg44qIn7f6IyBDPew14J6F6YFLTVlUPfzm2g8JsheTsJIKiIidV0B2zhdb2e6zITxgXn4jjJd3kpj1HZnLO1JATwQKRLlrH/yUb5WsIfjCV6XaPcuT4HvJSXeQUpBMYPm3fepDd5eHYux3kL/gmWalL/FFeERnihzBhJpRtMggnHwAFU9lSSkov/YYecw2b1s0nPmUuQuPbw6QquVzTSVOjwtZ1LxMdPsdXWlKFhkJhFI5JBgBkvZyNlo+Bef5sj9j6KLt0kCFLG3qDhllxoYTog+jrdzJ0T4KMID+7iKyUFdN9nDvAUpEhxmc037G8UeYgKAMSpssC3kK9O9iH3TlKdEQsofrwh9EBOlApEgvEpxMX/T9MWmQsKiXAlx6VdUaQVOFh68RxfAx+LyNhFH0obAB+CfjePDOHE/gdGgr9icNMHqf1cjY69iHZCehnKGwFjiJ4VaSL1ocRH2lgghEDWoqQFCJYhHeQmfg8b0NyFfgAD+8Lk/CdWvzgf8CVqLviXNLXAAAAAElFTkSuQmCC">&nbsp;CryptoKitties</a></li>
                        <li><a class="gameChange"><img data-appid="8" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAL4klEQVRYhSXS6Y9d5WGA8eddzjn33H2ZffE43hcGbMxiDDgUJTQhQk0iBRUBobSVkKo2bZVEFWpRP6SJmggpVaRETRN1EaQtbWgFRKBiwBDbLDYY7wt4PPt45s7cfT3be/qBP+H56RHf+eWxZS+IMr0gJDICWyscx0JagpwtKSUtYiHxghCExghFhEQKjYkFIAhCD9/ro4TBGOj0O3heiB9GBKFBGIGWAqnBCyJaHR8/igkj09LVVncsRhIDUgLESCFxbYllxRhiEq4mkx/EBC1EsIoIQgiamKAOoSE0Ad1A0gnTxMqiH6dBJ1F2Gs9T9IOYbqeFFTbx/BDfxJhYEIVhRkutWkKpjCUVwoAUAq0Frq1J258VltsKdeE/yXXeppCsMJQ2uFZE0vUpDTjEPUO7FVDpCjzPoIubOHaxQaOfJJccI3AyBNlbmQu2IKINXA1+aJA4LZ3NZBECtIjRQiClQCqBJSSGGD8xyPKx/6D91nfZPQTZ9M3MppIUBqqUhI2XTjO03SKZD9CpmKX5Gm5/nvF4gU9PN9k0AjaQKAwR7v4xM/4odlhDCIHSIE0UIYXAsS2SriKVgKQWiDgkcEpE5U8YuPADHjl8H3/y5Z/z6NA3ke/62Jf2cLDwpzSPjnLxvCCVHyHpZskPluibFMMjWymODRGlhlCFUS6dLRN98iIjAzlioRASBAYZhiGe72OMIUYSRJq+EXRJECJofPAzXLdPqTaOem+eV5bf55i/AJHgvfMf86q3gjussGIPS0uKuQTalmhXsKkEQSug3Q5x05D1F8noDpabwnUT2I6NFlJh4hg/DNFaEwlFZAQyNc76uRcJr/6aYHgnPz1/mfXyO7zXuMGhbZv4+fIF5j5e4fe+soXRAUkQWjgWaAFbJrM0OgHLaxZz9TqaPuniIEndxTctVKKEHYFlWWhbCqRWKK0xQiKkhRAKjEc8/yqpJDiO4ERYoZ0WfOvQNLumBAsbHR7K7mLP9iRhoHn7vUX+7/0WCTfLUD5itKiotDVWpkgq7RJGoEwdWkvY+c3YnkcM6HQqAVJipCQWCqQA6RCoJK4tcZIu6YzLNz+fJpG0GCkIvFaNnSMRxYKNCQVvnWryzy+tUQ+H0W4Cr9fFirskVJvpPZNoy2CiHq3yIvlsRHrMJjI2MTHaKEUcC2IEAiAW2Pkhmpff4sJbr/HQfVsI4j5nPvUp9yTVaoNNoyPs3rubcGaDpeUqRz/qkc7vZJgevW6P4rBLuxnQa9ucv9yk2a6RVILRe/6QLfsfpNeuIiwbJ47RISAEKKlASWLloPwm8tSPWFnocHYmZLk8yztnswRmAGfzndS23MGlqy0WLlSZmpomO7CMMB69fgyJLEZmieIAyxEkCuNISzC+5x52PPAIJvSIgwgtFEIItBIKKSRSyc8ULAfVKaN6G5AbYWauQ7K0nwM3tfHy+3jgmb9nbWGR57/9N+y+ZQupoU2owgiy16XTapMcG8cWkF1JUS9fozS+mZGbH2do9yG049KpraOFIfBDjFZoqRRSCIgBYRAGhO3gZBKkcwPc/KX7CXsRBovrGxYv/O3PmdxW5InvP02r3OP82RtMbr2dQt4iNhHdap1uZZbJ23+X6Q1DrX6OwT3PEGmXXn0N204wVHAxMZTXGmhiAJCxIFaSSLnQvo4brpBODXN9fhGvfoNv/cVfMrbjPn74wjtUN7q0mwZPaL79vYfxHJeri33qy2uozAKJUoqBYpHG2hFsCUW3iUyl8ZVLYARS2WAitGOhjQmR2gb92YzGTuJfewPZWIEozYcv/y9TY3D5nX9kanKCvXfuotJ1WHj7DKnNRXbuyLMOzIeKkjvI+LRDHKW48JujnL+wwKabb2Xnzs3cMpUj2U9ztRXz0qlVvHqLtOugQzRaavxYEBpJRhmC9fMsb0CWNXJJydSWEWbOn+CNf/ou7dHHUHvuZc/t2+kpzdluhHAVLb9Cd70G/QpBrczCyee57aYME196mCsrIfNLc8SxwgjJtqwgn7PR0qAdy6IbCRwRUyzkqV47QTB/HDtfItuRHL69hIqq9Mo+jckmf/zoPl44fp3X3r3BbYfv4uKp63SkoWs02wouS+9vsDJzjaf+7A/oX34Tb3CSmXqAiLrkcgkKMmYiJ1HKwvN9xNFTZ5tzLSeTT9lkcnme+/FfoS7/gmRpipVqh/GSwZKg0IQyolhMsuXwn3Oks5fc1t0YfGrrG0xPb8VJuGzMN5k/+SYDYZX7D20nPzZB3x8j6neRMkRJQSwU9U4Toqila31FxoE+DtcuzDB75gNuGnCp1Cv4vRAt8qRcgW1JlErQaK/j9C/z6AMP8+xLpynmHIZKJa7+9iMaModYm0M01/jVS7/h2Kse9+7qcefXv4+fv4O4v4a2NemEIg4DkspHvj3bZbnhc3G+xbELa2ysraMFDA845JKQSgkGCkkyaU1xsEAuE5PNFBm3LZaOvszGpUsce+0Nfv3sT+h368hsDo3gd776ALWNdc5+PEOlVqbtBzi2g2tpZLdBSsZU+gnUj37wd09PZmIn73S4bd/NVBs1qpd/y8hADiEElvbJZ5KkkxYi7mGPbGPzgcfpL7zBcAbOnilTyimqqwt87e69fPWRB/mv516gu3KVA3fejVAl1pc/ZceefYyNDtDu9dkI0lS6ERXf8eVE1kYpzc7xAl+YzvPgQ18nNeBiyy7ZjAMmYmN1FUJDHHXYvOswlcUTnHn1exwcrfD7h0q0l9eZmhzngcI53CvPs+feg3x4/ATrG2Vm623OXZnDtNc58cKzvP4vf81akKNub8ITLurL33jy6SAyjkBD7DM8WKB8/TROOM/I8DBKK05eqBDHIbt2TeI4CTqzx3GNort6mTsO7GC1m2N3uswXprv89Ge/pKenePjxP+LYm0dodZocvv8wp48fwVs+weV3j7NpyCFaOQ2pnK9TyQSGmPVqk/XyGvnBIYbG93J99hjldpvIRIwMD9Pvb7C6sMoObWH5bWQqiQkUq5de46mDd0MEi0vLhO11Bqlz+P57WLt+lqSMcVIujWtncMI2E9u3c/HNf6WytMRdj30HbcIekR/hdaq0Wx61rkWl0aHb9whFnXzaYWrCYbUM586XSeokW6aytHt93GIaRxuClbdxMwWaTU3GzSMWj/LGP3zCeCpFp9JANFy25pos1zrUgyLVWsTY1r3ULhxB91o1+u0uUkrchIuRoNwBhCMppJKUsppM0qXVKeLFAR9cXiGTs9n5uRRdT+A6MVIkkMpBBC2UtCFYpXXlEhUj8Y2BQKCTGUikoRewbSJJFMPSShcdeTFaCixHk0qkqVR7xOSx8jeRElfIZSawlWQon6LTmqUSTXFmZYR9e6qAxsfGkQapDd1exFAmheumMIM5jBH4fohBI7Tg3LykYxxko4ExFsVCFt33I5Ry0EqitaQ4OEg1naBT2E/rxiLFXpe+UaTdFENTh6itF3j/SpViGh77oqbdM4S+Tavdp9LsUyrZqDjAD8DEMUnbQQhodRsUs0lu+eI32L33Vl5/7ie8f+oDtFKCSAhq7RAtE4SNWSoL5xHSYuSmJ4lkRH5wiDACb2kNqzkPfotfHRFIYXjqKy5+rHj3dB+v2yNXAkfahGGM1JogCDCxIBQ5djltBlv/w/SBJ7nlnpf54ZP3oR599ImnhYgdK5Ej6tW4+uITYBcY2zZNvbbBUrnCzNwi9WaTD0+eJOW6ZLJpwqDFyYshrY5hepsFsWJ0dAShbOYWKnTafVbW60hls337JOmUIjAWlfmLLK6uMXHX19i0ecLXQsQZACuZp3Lm35DriyTGPk8yUaC8/Dpzs7Os3FijNDLOtZk5fK/H/v23snJjmYkRh1c+UtRbK9y9I4EnQi5evcGVT1ewbQgDyVpX8MoH17jvgObgviHmw210l09y5r+fobhpT0b7sVxpUMgE5TK95SOkBsEOb1BdX2JoeJjdu7Zz5M236PmSOw/ew8LcIktLyxQHBgm9Lvs/F7E+P8u/XzL0PEgmwXbAdR2swjBLCxafzCxx6bogIMlUKYPXq+OXz9Nor7X+HzKZidJkfJR9AAAAAElFTkSuQmCC">&nbsp;EtherBots</a></li>
                        <li><a class="gameChange"><img data-appid="9" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQyIDc5LjE2MDkyNCwgMjAxNy8wNy8xMy0wMTowNjozOSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjhBODMzMTVEODkxODExRThBOThCOTBGMjBGRDIyRTlDIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjhBODMzMTVFODkxODExRThBOThCOTBGMjBGRDIyRTlDIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OEE4MzMxNUI4OTE4MTFFOEE5OEI5MEYyMEZEMjJFOUMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OEE4MzMxNUM4OTE4MTFFOEE5OEI5MEYyMEZEMjJFOUMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz401KyjAAAFuUlEQVR42uyWeVDUZRjH39+x98Euyx7swq6wooaoQAIqoySogyGNIyLkjImUGmmjOUnHmFlTYp55TnkOpRiJlKbiyJFgyqEg4EoccixLu7Dsssuy9+8KxxmcGsyj7C+/f7/v5/s+73zf93kgiqLA8xQMnrNeGDxW6JMs0g0YC1quV9m1OABqhigtOCZCMRaGnuhw0D+n6PfBnv3Osp86mgYcbD8So+EYSWIIRoxDRUn+EUtCY2Vc4bMbnLxQkUOVWwWw10EPCjAbMY6VYjoRBuYGMO72wwb8B4mswIS3wuchMPzUBicKS3ecqfKj2I33FNtX52XG/lLTIkdU3J5BVhUSWOcbXI0rHSRNYdeHOThfTFkyVR7yFAb1rbrU9V+TqNJGD1s4sfTIyhxdLUcoRLkcwtLqEgZDTpxW2S8/poo7zYzmuCwSnT5HlZIWHvdg+zCTIHAUpY2eIor07NmWca9oP/PeHuvt8ysSyoaz0I/zCX++Rs81SSVmjrzLwEkQG/K8x0+1f0NDmL1Bqk2dhcXdmgcEfctRArc9Mqb1dYdKz5a9kQ7drrFf/HTf4UONnTqZejyM2Sk6A4hkiGMQo/mgFrFfu0W2lF1/jdwLPKhB5V851HWfbrjJJo8zmL6jX5G21/LlBt8jp4G23l85ng1s7to6IpDp5fkzrXaITgMkBUiCQlGIIABJQhATkTq1Z/HwxYws96QMQGHLLdnHDYXscMPoFdyoOZq1MuWD7PV0DHN02Hq1IHIsqFVM7PMwGQAnSGgYisAQQQ47QQhKQV7cSFOm+Nb/xoRhCBTq38tnRjUjAmd/0ygG3YYBg01Z0zRTr+8ZIpMh2M5CCCuO7uxUG/twLhthUZgUMvoBs4Q0yRjmYSJODRNIMATdZYDP+7K7KR1wKt6RJSOGt/9uMGDD1m7PTU/QnCks/f7kVYeLzWKjECBwvo/5Rg9usNIEFI3CtmKJK7zpn3AW5FhnmxxMEcsjIfsP8OevlsnuAMLfSzAZvXPdWq/ww4dfhceLaVq6Soq/27kwV87UZS57N3N5eHjwsd4+mgil+hFWX6sFF7iB1pMKv3mBP4MG92M9UqShPfOlCqOdEcjxnOPIgUZ7mZREuppl1ppF1pv0GXsfVlDVdmdt47aQVSXj4jCAcLds3V9bvh3IMJzi0RCvyYUM/QHRIQhyA/WgATS5sAqMVdVWIM3jQF4UcdU0qyaUGcfwOqZjjbzB/i67cg14RV+d9LCCCIX6467UU5vLPxM3V3xkifItLyr27KL5+DA8ALJprAIx1B0S5LHB/PlmTbtOmCjUJEzqkLKcZorNoWEL81cSBu9Ghisx9rWDZC5g8ESYmQbPASOvbkSVldVJm1OX5cYDkfBANpNy+ZBUZFDeqshopbVa2XzJr+m8n7sUJUpRwyVu3Tk5dRfs+CoeTN2jfHVDxPyDw4RWSyfcuGVzyVS7vuEB8y8pmjYt+sSaA/VXfHjr4tZ2x6aWzY4qju/M/rnJtKzaOCXEzwQzGG1WQTddMsQSKrmmAVy09+osKc/gy2WLxtEJggwRjMmXLRXjXojOGf0diCWSin3HQkuN4PqtgqSy2nk7RVZ64Nw5BZUBOA6kCgjloQ4rGaT2iJTe13en6E2IQgIBtmRRrBpB7tMWi0NiBEsc9uZHfhUCX+GvRSUZsxYBYGPxA5TJq+T0jh8b4/NuTxdAPRPkrkDEjMLGdT+kXalWh6ncgO0fNVaUkTxjhBDx8kamMOrx/SD/4rWjRfU6fR+EO/pAdErorW/Td9cKJmO4J3fTxMM1sybHDsVHTEiODY2PCX3Gjmazuy6W36y923G5pkeFOIITmw4FT+cHsJwNnrRW8ZrE2THhY/5VyxyRw+k2GK12jzXz6qkOhjdgAb+Cs86XxX38TuoppTUb5bvez8o//ITroWcYHS+3NXBIZOb4sP9gqngx2f0PBn8KMADVJxhhBGpvyAAAAABJRU5ErkJggg==">&nbsp;FishBank</a></li>
                        <li><a class="gameChange"><img data-appid="11" src="data:image/png;base64,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">&nbsp;CryptoBarons</a></li>

                        <li><a class="gameChange"><img data-appid="2" src="data:image/jpeg;base64,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">&nbsp;CS</a></li>
                        <li><a class="gameChange"><img data-appid="3" src="https://steamcdn-a.opskins.media/steamcommunity/public/images/apps/578080/93d896e7d7a42ae35c1d77239430e1d90bc82cae.jpg">&nbsp;PUBG</a></li>
                        <li><a class="gameChange"><img data-appid="4" src="https://steamcdn-a.opskins.media/steamcommunity/public/images/apps/433850/a7a0cef96f9cf83f4afd7cb52a48174f2dfbb663.jpg">&nbsp;H1Z1</a></li>
                        <li><a class="gameChange"><img data-appid="5" src="https://steamcdn-a.opskins.media/steamcommunity/public/images/apps/440/e3f595a92552da3d664ad00277fad2107345f743.jpg">&nbsp;TF2</a></li>
                        <li><a class="gameChange"><img data-appid="6" src="https://steamcdn-a.opskins.media/steamcommunity/public/images/apps/570/0bbb630d63262dd66d2fdd0f7d37e8661a410075.jpg">&nbsp;DOTA2</a></li>
                    </ul>
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