const express = require('express');
const {success, fail} = require('../../comman/tool');
const token_api = require('../../logic/token/token_api');
const router = express.Router();
/**
 * 查询所有代币
 */
router.get('/alltoken',(req, res) => {
    // req.query = {address: "0xadfasfasfasd..."}
    // 解构赋值
    let {address} = req.query;
    token_api.getAllToken({address:address},(error, data) => {
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
    let {address, name, symbol} = req.body;
    token_api.addToken(req.body,(error, data) => {
        if(error){
            res.send(fail(error));
        }else{
            res.send(success(data))
        }
    })
})
module.exports = router;
