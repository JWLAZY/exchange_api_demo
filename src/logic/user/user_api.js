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
    topUp: (userid,count, callback) => {
        const sql = 'update user set balance = ? where  id = ?';
        sqlhelper.query_objc(sql, [count.userid], (error,data) => {
            callback(error,data);
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