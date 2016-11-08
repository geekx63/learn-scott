import OkCoin from "../market/okcoin";
import HuoBi from "../market/huobi";
import events from 'events';
let emitter = new events.EventEmitter();

module.exports = (config) => {
    let okCoin = new OkCoin(config.okCoin,()=>{
    	emitter.emit('marketDataChange');
    });
    let huoBi = new HuoBi(config.huoBi,()=>{
    	emitter.emit('marketDataChange');
    });

    emitter.on('marketDataChange', ()=>{
    	let now = (new Date()).getTime();
    	let okTime = okCoin.market.lastData.timestamp;
    	let hbTime = huoBi.market.lastData.time;
    	console.log('now:'+now+'okTime:'+JSON.stringify(okTime)+'hbTime:'+JSON.stringify(hbTime))
    });

    return async (ctx) => {
    };
}
