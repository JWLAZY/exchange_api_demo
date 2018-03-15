const sqlhelper = require('../../comman/sqlhelper');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const secort = require('../../config/index').getConfig().secort;
const web3 = require('../../comman/web3helper').getWeb3();

let method = async function (error, data) {
    if(data){
        callback(new Error("该手机号已经注册了"))
    }else{
        // 生成加密字符串
        let salt_text = salt()
        // 生成新的eth地址
        // await 等待后面的promise执行完,并且把执行结果赋给左值
        // account = 就是create() 执行的结果
        let account = await web3.eth.accounts.create();
        // 生成新的密码
        let newpwd = encrypt(password, salt_text);
        const sql = `insert into user (tel,email,password,salt) value (?,?,?,?)`;
        sqlhelper.query_objc(sql, [tel, email, newpwd, salt_text], (error, data)=>{
            callback(error,data);
        })
    }
}
module.exports = {
    /**
     * 用户注册事件
     */
    register : (params, callback) => {
        // 判断是否之前注册过
        let {tel, email, password} = params;
        // 代码中使用await 则方法声明中要加入async关键字
        findOneUser(tel, async (error, data) => {
            if(data){
                callback(new Error("该手机号已经注册了"))
            }else{
                // 生成加密字符串
                let salt_text = salt()
                // 生成新的eth地址
                // await 等待后面的promise执行完,并且把执行结果赋给左值
                // account = 就是create() 执行的结果
                let account = await web3.eth.accounts.create();
                let {address,privateKey} = account;
                let temp = account.encrypt(salt_text);
                // 把备份文件写到钱包读取的地方
                let ethbackup = JSON.stringify(temp);
                // 生成新的密码
                let newpwd = encrypt(password, salt_text);
                const sql = `insert into user (tel,email,password,salt,ethaddress,ethkey,ethpwd, ethbackup) value (?,?,?,?,?,?,?, ?)`;
                let objt = [tel, email, newpwd, salt_text,address,privateKey,salt_text, ethbackup];
                sqlhelper.query_objc(sql, objt, (error, data) => {
                    callback(error,data);
                })
            }
        })
    },
    /**
     * 用户登录
     */
    login: (params, callback) => {
        let {tel, password} = params;
        findOneUser(tel,(error,data) => {
            if(error){
                callback(error);
            }else{
                if(data){
                    //取出数据库的salt 生成加密密码 => 比对
                    let {password:tpassword, salt} = data;
                    if(encrypt(password, salt) === tpassword){
                        // 生成一个口令给调用者
                        // 加密内容,加密密钥,过期时间
                        let token = jwt.sign({
                            id: data.id,
                            tel: data.tel,
                            email: data.email
                        }, secort, {expiresIn: '2h'});
                        callback(null, {
                            msg: "登陆成功",
                            token: token
                        });
                    }else{
                        callback(new Error("用户名或者密码不正确"));
                    }
                }else{
                    callback(new Error("该用户没有注册"));
                }
            }
        })
    },
    /**
     * 获取用户余额
     */
    getUserEthBalance: (id, callback) => {
        const sql = 'select * from user where id = ?';
        sqlhelper.query_objc(sql, [id], async (error,data) => {
            if(error || !data || data.length == 0){
                callback(new Error("参数错误"));
            }else{
                let address = data[0].ethaddress;
                let balance = await web3.eth.getBalance(address);
                let ethnumber = web3.utils.fromWei(balance,'ether');
                callback(null, {balance:ethnumber})
            }
        })
    },
    // 购买ether币 count = 10
    buyCoin: (address, count, callback) => {
        // 假设: 1 eth = 100rmb
        // 0. 检测数据库余额够不够
        // 1. 构建账单
        // 2. 对账单签名(账单,发送方的密钥)
        // 3. 发送签过名的账单(签名账单结果.rawTransaction)
        // select * from user where ethaddress = '0xasadsasd' and balance >= 1000'
        let sql = 'select * from user where ethaddress = ? and balance > ?';
        sqlhelper.query_objc(sql,[address,count * 100],async (error,data)=>{
            // 余额不足或者其他错误
            if(error||data.length == 0){
                callback(new Error("购买ether 出差请查看余额"))
            }else{
                // 交易账单
                let form = "0xc375Db4A3D0A51464b5e0FF678704d8E71A146d7";
                let formkey = "0xb6e963244393c684cbee7fc7e1996100134a9ae0b13947bb7122d9f28ccd7da7"
                let value = web3.utils.toWei(`${count}`,'ether');
                let txParms = {
                    from: form,
                    to: address,
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

            }
        })
    }
}

// 根据tel 来获取注册的用户
const findOneUser = (tel, callback) => { // tel = "1 or 1 = 1;delete "
    const sql = "select * from user where tel = ? ";
    sqlhelper.query_objc(sql,[tel],(error, data) => {
        callback(error, data[0])
    })
}

// 生成 随机字符串
const salt = () => {
    var time = Date.now() % 100,
    str = '';
    time = time === 0 ? '00' : String(time);

    for (var i = 0; i < 8; i++) {
        // 65 A 97 a base > 65  base < 97
        const base = Math.random() < 0.5 ? 65 : 97;
        str += String.fromCharCode(
            base + Math.floor(Math.random() * 26 )
        );
    }
    return time + str;
};
const md5 = (text) => {
    return crypto.createHash("md5").update(String(text)).digest("hex");
};
 const encrypt = (password,salt) => {
    return md5(md5(password) + salt);
};