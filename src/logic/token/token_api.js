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
    }
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
