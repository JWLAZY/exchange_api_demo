const sqlhelper = require('../../comman/sqlhelper');
const web3 = require('../../comman/web3helper').getWeb3();
const path = require('path');
const fs = require('fs');
module.exports = {
    // 转token count * 小数点位数
    tranToken: (fromid, toid, count, tokenid, callback) => {
        getContract(tokenid, async (error,contract) => {
            let data = contract.methods.transfer("0xd117c5478d0F0aA21546566468025863656F9D00", count * 1000000).encodeABI();
            let nonce = await web3.eth.getTransactionCount('0xc375Db4A3D0A51464b5e0FF678704d8E71A146d7');
            let price = await web3.eth.getGasPrice();
            let gas = await web3.eth.estimateGas({
                from: '0xc375Db4A3D0A51464b5e0FF678704d8E71A146d7',
                nonce: nonce,
                to: contract.options.address,
                data: data,
              })
            const txparams = {
                from: '0xc375Db4A3D0A51464b5e0FF678704d8E71A146d7',
                gasPrice: price,
                gas: gas,
                nonce: nonce,
                to: contract.options.address,
                data: data,
                chainId: 15,
            }
            const tr = await web3.eth.accounts.signTransaction(txparams,"0xb6e963244393c684cbee7fc7e1996100134a9ae0b13947bb7122d9f28ccd7da7");
            web3.eth.sendSignedTransaction(tr.rawTransaction)
            .on('transactionHash', (hash) => {
                console.log(`transactionHash:${  hash}`);
            })
            .on('receipt', (receipt) => {
                console.log(`receipt:${  receipt}`);
                callback(err, receipt);
            })
            .on('confirmation', (confirmationNumber, receipt) => {
                console.log(`confirmation:${  confirmationNumber}`);
            })
            .on('error', console.error);
        })
    },
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
                    return getTokenInfo(contract);
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
    }
}

// 根据一个tokenid 来获取contract
let getContract = (tokenid, callback) => {
    let sql = 'select * from token where id = ?';
    sqlhelper.query_objc(sql,[tokenid], (error,data)=>{
        if(error || data.length == 0){
            callback(new Error("没有这个id"));
        }else{
            let filepath = path.resolve(__dirname,'../../solinterface/token.json');
            let interfacestring = JSON.parse(fs.readFileSync(filepath)).interface;
            let interface = JSON.parse(interfacestring);
            let contract = new web3.eth.Contract(interface, data[0].address)
            callback(null,contract);
        }
    })
    
}

// 根据一个智能合约 来查询智能合约的数据
let getTokenInfo = (contract) => {
    return new Promise((resolve,reject)=>{
        return Promise.all([
            contract.methods.totalSupply().call(),
            contract.methods.name().call()
        ])
        .then(results => {
            // results 是由promise.all 的方法执行结果的结合
            resolve({
                total: results[0],
                name: results[1]
            })
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
