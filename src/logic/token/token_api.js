const sqlhelper = require('../../comman/sqlhelper');
const web3 = require('../../comman/web3helper').getWeb3();
const path = require('path');
const fs = require('fs');
module.exports = {
    /**
     * 添加代币
     */
    addToken: (params,callback) => {
        let {address, name, symbol} = params;
        findOneToken(address, (error,data) => {
            if(data){
                callback(new Error("该合约地址已经添加了"));
            }else{
                let sql = "insert into token (address, name, symbol) value (?,?,?)";
                sqlhelper.query_objc(sql,[address, name, symbol],(error,data) => {
                    callback(error,data);
                })
            }
        })
    },
    /**
     * 查找所有代币
     */
    getAllToken: (params,callback) => {
        // 参数里面有一个用户地址
        let {address} = params;
        let sql = 'select * from token;';
        sqlhelper.query(sql,(error, data) => {
            if(error || data.length === 0){
                callback(error,data);
            }else{
                let filepath = path.resolve(__dirname,'../../solinterface/token.json');
                let interfacestring = JSON.parse(fs.readFileSync(filepath)).interface;
                let interface = JSON.parse(interfacestring);
                // 遍历token ,获取代币集合
                // let actions = data.map(token => {
                //     let contract = new web3.eth.Contract(interface, token.address)
                //     return contract.methods.totalSupply().call()
                // })
                let contracts = data.map(token => {
                    let contract = new web3.eth.Contract(interface, token.address)
                    return contract;
                })

                let actions = contracts.map(contract => {
                    return getTokenInfo(contract, address);
                })
                // actions = [
                //     getTokenInfo(contracts[0]),
                //     getTokenInfo(contracts[1]),
                //     getTokenInfo(contracts[2]),
                //     getTokenInfo(contracts[3])
                // ]
                // Promise.all([promise1,promise2]) 只有当
                // 参数中的所有promsie状态都改变的情况下,
                // promise.all 才算执行完成
                Promise.all(actions)
                .then(results => {
                    // 将去链上取回来的数据 赋值给从sql中取出来的对象
                    results.forEach((result,index) => {
                        data[index].tokeninfo = result;
                    })
                    console.log("多个promise 都执行完成")
                    callback(error, data);
                })
            }
        })
    },

    /**
     * 代币转账
     */
    transToken: async (callback) => {
        let fromAddress = "0xc375Db4A3D0A51464b5e0FF678704d8E71A146d7"; // 转币方
        let toAddress = "0xd117c5478d0F0aA21546566468025863656F9D00"; // 接收方
        let fromKey = "0xb6e963244393c684cbee7fc7e1996100134a9ae0b13947bb7122d9f28ccd7da7"; // 转币方私钥
        let contractAddress = "0x12949d5846961fc4145b21bd3c6e49ea03cb255a"; // 代币地址
        // 代币转账 相比较 ether 转账而言,就是 不传value 传data(data:智能合约方法的16机制字符串)
        // to : 代币交易接收方是代币地址
        // 1. 拿到智能合约实例
        let contract = getOneERC20Token(contractAddress);
        // 2. 合约转账方法 编码 => "0xsafsad" 的16机制字符串
        // 获取代币最小单位
        let decimals = await contract.methods.decimals().call(); // 6
        let value =  1000;
        for(let i = 0;i < decimals;i++){
            value = value * 10;
        }
        let cdata = contract.methods.transfer(toAddress, value).encodeABI();
        // 3. 构建账单
        let tx = {
            from: fromAddress,
            to: contract.options.address,
            data: cdata,
            chainId: 15
        }
        // gas gasprice nonce
        tx.gas = await web3.eth.estimateGas(tx);
        tx.gasPrice = await web3.eth.getGasPrice();
        tx.nonce = await web3.eth.getTransactionCount(fromAddress);
        // 4. 签名账单
        let signTX = await web3.eth.accounts.signTransaction(tx,fromKey);
        // 5. 发送账单
        web3.eth.sendSignedTransaction(signTX.rawTransaction)
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

    },

    transTokenForUser: () => {
        
    }
}

// 通过代币地址来获取代币实例
let getOneERC20Token = (address) => {
    let filepath = path.resolve(__dirname,'../../solinterface/token.json');
    let interfacestring = JSON.parse(fs.readFileSync(filepath)).interface;
    // 智能合约 => ABI
    let interface = JSON.parse(interfacestring);
    // 构建一个智能合约对象.并且返回(这个实例是和链上智能合约互动的一个桥梁)
    let contract = new web3.eth.Contract(interface,address);
    return contract;
}

// 根据一个智能合约 来查询智能合约的数据
// address 可传值 可不传(不查)
let getTokenInfo = (contract,address) => {
    return new Promise((resolve,reject)=>{
        let actions = [
            contract.methods.totalSupply().call(),
            contract.methods.name().call(),
            contract.methods.symbol().call()
        ]
        if(address){
            actions.push(contract.methods.balanceOf(address).call());
        }
        return Promise.all(actions)
        .then(results => {
            // results 是由promise.all 的方法执行结果的结合
            let temp = {
                total: results[0],
                name: results[1],
                symbol: results[2],
            }
            if(results.length == 4){
                temp.mybalance = results[3]
            }
            resolve(temp)
        })
    })
}

let findOneToken = (address, callback) => {
    let sql = 'select * from token where address = ?';
    sqlhelper.query_objc(sql,[address],(error,data) => {
        if(error){
            callback(error);
        }else{
            callback(null, data[0]);
        }
    })
}
