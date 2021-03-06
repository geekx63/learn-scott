import websocket from 'websocket';
let W3CWebSocket = websocket.w3cwebsocket;
let socketUrl = 'wss://real.okcoin.cn:10440/websocket/okcoinapi';

class OkCoin {
    constructor(opts,callback){
        this.wsUri = socketUrl;
		this.apiKey = opts.apiKey;
		this.secretKey = opts.secretKey;
		this.lastHeartBeat = new Date().getTime();
		this.overtime = 8000;
		this.market = {};
		this.callback = callback;

		this.ws = new W3CWebSocket(this.wsUri);
		this.ws.onopen = (evt) => {
			this.onOpen(evt)
		};
		this.ws.onclose = (evt) => {
			this.onClose(evt)
		};
		this.ws.onmessage = (evt) => {
			this.onMessage(evt)
		};
		this.ws.onerror = (evt) => {
			this.onError(evt)
		};
    }
}

OkCoin.prototype.checkConnect = function() {
	this.ws.send("{'event':'ping'}");
	if ((new Date().getTime() - this.lastHeartBeat) > this.overtime) {
		onsole.log("socket 连接断开，正在尝试重新建立连接");
		//testWebSocket();
	}
}

OkCoin.prototype.onOpen = function(evt) {
	this.print("CONNECTED");

	this.doSend("{'event':'addChannel','channel':'ok_sub_spotcny_btc_ticker'}");
}

OkCoin.prototype.tradeTest = function(){

}

OkCoin.prototype.onClose = function(evt) {
	this.print("DISCONNECTED");
}

OkCoin.prototype.onMessage = function(e) {
	var array = JSON.parse(e.data);

	for (var i = 0; i < array.length; i++) {
		if(array[i].channel == 'ok_sub_spotcny_btc_ticker'){
			this.market.lastData = array[i].data;
			this.callback();
		}

		for (var j = 0;j < array[i].length; j++) {
			var isTrade = false;
			var isCancelOrder = false;
			
			if (array[i][j] == 'ok_spotusd_trade' || array[i][j] == 'ok_spotcny_trade') {
				isTrade = true;
			} else if (array[i][j] == 'ok_spotusd_cancel_order'
				|| array[i][j] == 'ok_spotcny_cancel_order') {
				isCancelOrder = true;
			}
			
			var order_id = array[i][j].order_id;
			if (typeof (order_id) != 'undefined') {
				if (isTrade) {
					//下单成功 业务代码
					console.log("orderId is  " + order_id);
				} else if (isCancelOrder) {
					//取消订单成功 业务代码
					console.log("order  " + order_id + " is now cancled");
				}
			}
		}
	}

	if (array.event == 'pong') {
		this.lastHeartBeat = new Date().getTime();
	} else {
		//console.log(JSON.stringify(array));
	}
}

OkCoin.prototype.onError = function(evt) {
	this.print('ERROR:' + evt.data);
}

OkCoin.prototype.doSend = function(message) {
	this.print("SENT: " + message);
	this.ws.send(message);
}

OkCoin.prototype.print = function(message) {
	console.log('print:' + message);
}

//现货下单
OkCoin.prototype.spotTrade = function() {
	var sign = MD5("amount=0.1&api_key=" + this.api_key
		+ "&symbol=ltc_usd&type=sell_market&secret_key=" + this.secret_key);
	this.doSend("{'event':'addChannel','channel':'ok_spotusd_trade','parameters':{'api_key':'" + this.api_key
		+ "','sign':'" + sign + "','symbol':'ltc_usd','type':'sell_market','amount':0.1}}");
}

//现货取消订单
OkCoin.prototype.spotCancelOrder = function(orderId) {
	var sign = MD5("api_key=" + this.api_key + "&order_id=" + orderId
		+ "&symbol=ltc_usd&secret_key=" + this.secret_key);
	this.doSend("{'event':'addChannel','channel':'ok_spotusd_cancel_order','parameters':{'api_key':'" + this.api_key
		+ "','sign':'" + sign + "','symbol':'ltc_usd','order_id':'" + orderId + "'}}");
}

//现货个人信息
OkCoin.prototype.spotUserInfo = function() {
	var sign = MD5("api_key=" + this.api_key + "&secret_key=" + this.secret_key);
	this.doSend("{'event':'addChannel','channel':'ok_spotusd_userinfo','parameters' :{'api_key':'"
		+ this.api_key + "','sign':'" + sign + "'}}");
}

//查询订单信息
OkCoin.prototype.spotOrderInfo = function(){
	var sign = MD5("api_key=" + this.api_key + "&order_id=20914907&secret_key=" + this.secret_key + "&symbol=ltc_usd");
	this.doSend("{'event':'addChannel','channel':'ok_spotusd_orderinfo','parameters' :{'api_key':'"
		+ this.api_key + "','symbol':'ltc_usd','order_id':'20914907','sign':'" + sign + "'}}");
}
//订阅交易数据
OkCoin.prototype.spotTrades = function() {
	var sign = MD5("api_key=" + this.api_key + "&secret_key=" + this.secret_key);
	this.doSend("{'event':'addChannel','channel':'ok_sub_spotusd_trades','parameters' :{'api_key':'"
		+ this.api_key + "','sign':'" + sign + "'}}");
}
//订阅账户信息
OkCoin.prototype.spotUserinfos = function() {
	var sign = MD5("api_key=" + this.api_key + "&secret_key=" + this.secret_key);
	this.doSend("{'event':'addChannel','channel':'ok_sub_spotusd_userinfo','parameters' :{'api_key':'"
		+ this.api_key + "','sign':'" + sign + "'}}");
}

//合约下单
OkCoin.prototype.futureTrade = function() {
	var sign = MD5("amount=1&api_key=" + this.api_key + 
		"&contract_type=this_week&lever_rate=20&match_price=1&price=1.5&symbol=ltc_usd&type=0&secret_key=" + this.secret_key);
	this.doSend("{'event': 'addChannel','channel':'ok_futureusd_trade','parameters': {'api_key': '"
		+ this.api_key + "','sign': '" + sign + "','symbol': 'ltc_usd','contract_type': 'this_week','amount': '1','price': '1.5','type': '0','match_price': '1','lever_rate': '20'}}");
}

//合约取消订单
OkCoin.prototype.futureCancelOrder = function(orderId) {
	var sign = MD5("api_key=" + this.api_key + "&contract_type=this_week&order_id=" + orderId
		+ "&symbol=ltc_usd&secret_key=" + this.secret_key);
	this.doSend("{'event': 'addChannel','channel': 'ok_futureusd_cancel_order','parameters': {'api_key': '"
		+ this.api_key + "','sign': '" + sign + "','symbol': 'ltc_usd','order_id': '" + orderId
		+ "','contract_type': 'this_week'}}");
}

//合约个人信息
OkCoin.prototype.futureUserInfo = function() {
	var sign = MD5("api_key=" + this.api_key + "&secret_key=" + this.secret_key);
	this.doSend("{'event':'addChannel','channel':'ok_futureusd_userinfo','parameters' :{'api_key':'"
		+ this.api_key + "','sign':'" + sign + "'}}");
}

//查询合约订单
OkCoin.prototype.futureOrderInfo = function(orderId) {
	var sign = MD5("api_key=" + this.api_key + "&contract_type=this_week&current_page=1&order_id=" + orderId
		+ "&page_length=1&symbol=ltc_usd&secret_key=" + this.secret_key + "&status=1");
	this.doSend("{'event': 'addChannel','channel': 'ok_futureusd_orderinfo','parameters': {'api_key': '"
		+ this.api_key + "','sign': '" + sign + "','symbol': 'ltc_usd','order_id': '" + orderId
		+ "','contract_type': 'this_week','status':'1','current_page':'1','page_length':'1'}}");
}

//订阅合约交易数据
OkCoin.prototype.futureTrades = function() {
	var sign = MD5("api_key=" + this.api_key + "&secret_key=" + this.secret_key);
	this.doSend("{'event':'addChannel','channel':'ok_sub_futureusd_trades','parameters' :{'api_key':'"
		+ this.api_key + "','sign':'" + sign + "'}}");
}

//订阅合约账户信息
OkCoin.prototype.futureUserinfos = function() {
	var sign = MD5("api_key=" + this.api_key + "&secret_key=" + this.secret_key);
	this.doSend("{'event':'addChannel','channel':'ok_sub_futureusd_userinfo','parameters' :{'api_key':'"
		+ this.api_key + "','sign':'" + sign + "'}}");
}

//订阅合约持仓信息
OkCoin.prototype.futurePositions = function() {
	var sign = MD5("api_key=" + this.api_key + "&secret_key=" + this.secret_key);
	this.doSend("{'event':'addChannel','channel':'ok_sub_futureusd_positions','parameters' :{'api_key':'"
		+ this.api_key + "','sign':'" + sign + "'}}");
}

module.exports = OkCoin;