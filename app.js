const express = require('express');
// 解析http post 请求中的body => json对象
const bodyParser = require('body-parser');
// 打印 http 请求
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
// 导入路由表
const user = require('./src/router/user/user');
const token = require('./src/router/token/token');
const secort = require('./src/config/index').getConfig().secort;

const sqlhelper = require('./src/comman/sqlhelper');

// express() 方法构造一个实例对象
const app = express();

// 打印http 请求日志
app.use(morgan('dev'));
// 解析post 请求中的body
app.use(bodyParser.json())

app.use('*',(req, res, next) => {
    if(req.baseUrl === '/user/login' || req.baseUrl === '/user/register'){
        next();
        return; // 需要return,不然继续向下走
    }
    let header = req.headers;
    let token = header.token;
    jwt.verify(token, secort, function(err, decoded) {
        if(err){
            res.send({errmsg:"token错误"})
        }else{
            let userid = decoded.id;
            let sql = 'select * from user where id = ?';
            sqlhelper.query_objc(sql,[userid],(error,data)=>{
                // get req.query
                // post req.body
                // "GET" => "get"
                if(req.method.toLocaleLowerCase() === 'get'){
                    req.query.userinfo = data[0];
                    req.query.address = data[0].ethaddress;
                }else{
                    req.body.userinfo = data[0];
                    req.body.address = data[0].ethaddress;
                }
                next();
            })
        }
    });
})

// 127.0.0.1:3000/user/login

app.use('/user',user);
app.use('/token',token);

// 中间件 ,在网络请求中做一些处理
// 每一次网络请求进来都会调用一下这个中间件
// app.use((req, res, next) => {
//     let header = req.headers;
//     if(header.token){
//         next(); // 往下走下一个路由
//     }else{
//         res.send({
//             errcode: 1,
//             errmsg: 'header 中没有token'
//         })
//     }
// })

// app.post('/login', (req, res) => {
//     //只有在使用了 body中间件解析后.req.body 才有值
//     res.send(req.body);
// })

// app.get('/login',function(req,res){
//     res.send('login')
// })
// app.get('/userinfo', function(req, res){
//     res.send('userinfo')
// })
// // 当访问链接为 http://127.0.0.1:3000/ 时会触发这个回调
// // http 请求上下文
// // get 传值  url/path?参数名=值...
// // 通过request.query 取到请求参数
// app.get('*', function(request,responsen){
//     // response => http 返回实例.通过send方法响应请求
//     if(request.url === '/test'){
//         responsen.send('这是个测试');
//     }else{
//         responsen.send({
//             text:"hello world",
//             path: request.url,
//             params: request.query
//         });
//     }
// })

//监听 3000 端口
// 访问时 : http://127.0.0.1:3000
app.listen(3000);
