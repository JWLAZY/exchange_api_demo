const express = require('express');
const {success, fail} = require('../../comman/tool');
const token_api = require('../../logic/token/token_api');
const router = express.Router();
/**
 * 查询所有代币
 */
router.get('/alltoken',(req, res) => {
    token_api.getAllToken({},(error, data) => {
        if(error){
            res.send(fail(error));
        }else{
            res.send(success(data))
        }
    })
})
/**
 * 添加代币
 */
router.post('/addtoken',(req, res) => {
    let {caddress, name, symbol} = req.body;
    token_api.addToken(req.body,(error, data) => {
        if(error){
            res.send(fail(error));
        }else{
            res.send(success(data))
        }
    })
})

/**
 * 代币转账
 */
router.post('/trantoken',(req,res) => {
    const {tokenid,to,from,userinfo,count} = req.body;
    token_api.tranToken(from, userinfo.id,count,tokenid,(error, data) => {
        if(error){
            res.send(fail(error));
        }else{
            res.send(success(data))
        }
    })
})

module.exports = router;
