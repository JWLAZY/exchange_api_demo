const express = require('express');
const tool = require('../../comman/tool');
const user_api = require('../../logic/user/user_api');
const {success, fail} = tool;

const web3 = require('../../comman/web3helper').getWeb3();

// 创建一个路由实例
const router = express.Router();

// 配置路由信息
router.post('/login',(req, res) => {
    let {tel, password} = req.body;
    let params = {tel:tel, password:password};
    user_api.login(params, (error,data) => {
        web3.eth.getAccounts()
        .then(accounts => {
            if(error){
                res.send(fail(error));
            }else{
                res.send(success({
                    data:data,
                    accounts: accounts
                }))
            }
        })
    })
})

router.post('/register',(req,res) => {
    let {tel, email, password} = req.body;

    let params = {tel:tel,email:email,password:password};

    user_api.register(params, (error, data) => {
        if(error){
            res.send(fail(error));
        }else{
            res.send(success(data))
        }
    })
})

// /balance?id=1&name=wewrwe
// req.query = {id:1,name=wewrwe}
/**
 * 查询用户eth余额
 */
router.get('/balance',(req, res) => {
    let {id} = req.query;
    user_api.getUserEthBalance(id,(error,data) => {
        if(error){
            res.send(fail(error));
        }else{
            res.send(success(data))
        }
    })
})

// 用数据库的余额来购买ether
router.post('/buycoin', (req,res) => {
    //购买数量和购买者地址
    let {count,address} = req.body;
    user_api.buyCoin(address,count,(error,data) => {
        if(error){
            res.send(fail(error));
        }else{
            res.send(success(data))
        }
    })
})

// 挂单1 要用 10个ETHER 换 1000 MT
// 挂单2 要用 1000 MT 换 10个ETHER
// 挂单之后找到可以匹配的交易
// 然后转账(1的10个Ehter => 2, 2的1000MT转给1)

// 挂单1 要用 10个ETHER 换 1000 MT
// 挂单2 要用 1000 MT 换 9个ETHER
// 挂单之后找到可以匹配的交易
// 然后转账(1的10个Ehter => 2, 2的1000MT转给1)
// 中间商赚差价(把剩下的币转到中间商的账户)

router.post('/addorder',(req,res) => {
    user_api.addOrder(req.body,(error, data) => {
        if(error){
            res.send(fail(error));
        }else{
            res.send(success(data))
        }
    })
})

router.get('/getmyorder',(req,res) => {
    user_api.getMyOrders(req.query,(error,data)=>{
        if(error){
            res.send(fail(error));
        }else{
            res.send(success(data))
        }
    })
})

// 导出路由
module.exports = router;
