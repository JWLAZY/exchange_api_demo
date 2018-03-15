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

router.post('/topup',(req,res) => {
    let {count,userid} = req.body;
    user_api.topUp(userid,count, (error, data) => {
        if(error){
            res.send(fail(error));
        }else{
            res.send(success(data))
        }
    })
})

// 导出路由
module.exports = router;
