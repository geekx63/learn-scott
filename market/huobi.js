import io from 'socket.io-client';
let uri = 'hq.huobi.com:80';

class HuoBi {
    constructor(opts, callback){
        this.appID = opts.appID;
        this.appSecret = opts.appSecret;
        this.g_isConnect = 0;
        this.market = {};
        this.callback = callback;

        this.g_checkTimerEvent = setInterval(()=>{
            try {
                this.systemlog("checkConnection start");

                if(this.g_isConnect == 2)
                {
                    this.systemlog("checkConnection checking");
                    this.connect();
                }
            } catch(err) {
                var errMsg = this.dumpError(err);
                this.quicklog(errMsg);
            }
        },5000);

        this.connect();
    }
}

// 获取错误信息
HuoBi.prototype.dumpError = function(err) {
    var errMsg = '';
    
    if (typeof err === 'object') {
        if (err.message) {
            errMsg = '\nMessage: ' + err.message;
        }
        if (err.stack) {
            errMsg += '\nStacktrace:';
            errMsg += '====================';
            errMsg += err.stack;
        }
    } else {
        errMsg = '\ndumpError :: argument is not an object';
    }
    
    return errMsg;
}

// 写入到错误日志文件
HuoBi.prototype.quicklog = function(s) {
    s = s.toString().replace(/\r\n|\r/g, '\n'); // hack
    console.log(s);
}

HuoBi.prototype.systemlog = function(s) {
    console.log(s);
}
HuoBi.prototype.connect = function() {
    try {
        if(this.g_isConnect == 3){
            console.log('websocket client is connecting to push server:');
            return;
        }
        
        this.g_isConnect = 3;
    
        var option = {'force new connection': true, reconnection: true};
        var socket = io.connect(uri, option);
    
        console.log('websocket client connecting to push server:');

        socket.on('connect', function(){
            this.g_isConnect = 1;
            console.log('websocket client connect to push server:' + socket.socket.sessionid);
            var msg =  {symbolList:{lastTimeLine:[{symbolId:"btccny",pushType:"pushLong"}]},version:1,msgType:"reqMsgSubscribe",requestIndex:1404103038520};

            socket.emit('request', msg);
        });
        
        socket.on('disconnect', function(){
            this.g_isConnect = 2;
            console.log('websocket client disconnect from push server:' + socket.socket.sessionid);
        });
    
        socket.on('reconnect', function(){
            this.g_isConnect = 1;
            console.log('websocket client reconnect from push server:' + socket.socket.sessionid);
        });
        
        socket.on('message', (data) => {
            this.market.lastData = data.payload;
            this.callback();
        });
        
        socket.on('request', function(data) {
            console.log(JSON.stringify(data));
        });
        
    } catch(err) {
        var errMsg = this.dumpError(err);
        this.quicklog(errMsg);
    }
};

module.exports = HuoBi;
