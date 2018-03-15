const sqlhelper = require('../../comman/sqlhelper');
const web3 = require('../../comman/web3helper').getWeb3();


module.exports = {
    //转币
    transCoin: (fromid, toid, count, callback) =>{
        findOneUser(fromid,(error,fuser) => {
            findOneUser(toid, async (error,tuser) => {
                // 交易账单
                let form = fuser.ethaddress;
                let formkey = fuser.ethkey
                let value = web3.utils.toWei(`${count}`,'ether');
                let txParms = {
                    from: form,
                    to: tuser.ethaddress,
                    data: '0x00', // 当使用代币转账或者合约调用时
                    value: value, // value 是转账金额
                    chainId: 15
                }
                // 获取一下预估gas
                let gas = await web3.eth.estimateGas(txParms);
                // 获取当前gasprice
                let gasPrice = await web3.eth.getGasPrice();
                // 获取指定账户地址的交易数
                let nonce = await web3.eth.getTransactionCount(form);
                txParms.gas = gas;
                txParms.gasprice = gasPrice;
                txParms.nonce = nonce;
                // 用密钥对账单进行签名
                let signTx = await web3.eth.accounts.signTransaction(txParms,formkey)
                // 将签过名的账单进行发送
                web3.eth.sendSignedTransaction(signTx.rawTransaction)
                .on('transactionHash', function(hash){
                    // on 是事件机制,只有当方法调用过程中回调了transactionHash事件才会走到这里
                    console.log("hash success:" + hash);
                })
                .on('receipt', function(receipt){
                    // console.log("")
                })
                .on('confirmation', function(confirmationNumber, receipt){ 
                    console.log("收到第" + confirmationNumber +"次确认");
                    if(confirmationNumber === 12){
                        callback(null, receipt);
                    }
                 })
                .on('error', function(error){
                     callback(error);
                }); 
            })
        })
    },
    //交易差价转账
    tranRemainCoinTo:(fromid, count, callback) => {
        findOneUser(fromid, async (error,fuser) => {
            // 交易账单
            let form = fuser.ethaddress;
            let formkey = fuser.ethkey
            let value = web3.utils.toWei(`${count}`,'ether');
            let txParms = {
                from: form,
                to: "0xf362231d7230b09a3459788C59c0ABb4EA55E936",
                data: '0x00', // 当使用代币转账或者合约调用时
                value: value, // value 是转账金额
                chainId: 15
            }
            // 获取一下预估gas
            let gas = await web3.eth.estimateGas(txParms);
            // 获取当前gasprice
            let gasPrice = await web3.eth.getGasPrice();
            // 获取指定账户地址的交易数
            let nonce = await web3.eth.getTransactionCount(form);
            txParms.gas = gas;
            txParms.gasprice = gasPrice;
            txParms.nonce = nonce;
            // 用密钥对账单进行签名
            let signTx = await web3.eth.accounts.signTransaction(txParms,formkey)
            // 将签过名的账单进行发送
            web3.eth.sendSignedTransaction(signTx.rawTransaction)
            .on('transactionHash', function(hash){
                // on 是事件机制,只有当方法调用过程中回调了transactionHash事件才会走到这里
                console.log("hash success:" + hash);
            })
            .on('receipt', function(receipt){
                // console.log("")
            })
            .on('confirmation', function(confirmationNumber, receipt){ 
                console.log("收到第" + confirmationNumber +"次确认");
                if(confirmationNumber === 12){
                    callback(null, receipt);
                }
             })
            .on('error', function(error){
                 callback(error);
            }); 
        })
    }
}

let findOneUser = (userid,callback) => {
    let sql = 'select * from user where id = ?';
    sqlhelper.query_objc(sql,[userid],(error,data) => {
        callback(error,data[0]);
    })
}