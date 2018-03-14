const Web3 = require('web3');
const web3addresss = require('../config/index').getConfig().web3;
let web3;

module.exports = {
    getWeb3: () => {
        if(web3){
            return web3;
        }else{
            // 参数: 目标地址,或者provider实例
            // 8545 是本地节点开启的rpc默认地址
            // "http://127.0.0.1:8545"
            web3 = new Web3(web3addresss);
            return web3;
        }
    }
}