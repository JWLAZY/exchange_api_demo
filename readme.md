## 使用步骤

1. 开启私链 

 ```
 geth --networkid 10 --rpc --rpcapi "admin,debug,eth,miner,net,personal,shh,txpool,web3" rpcaddr "0.0.0.0" --rpccorsdomain "*" --nodiscover --dev console
 ```
2. 安装依赖包

```
 npm i
```
3. 配置数据库信息

路径在/src/config下

4. 启动

```
npm start
```


# 接口文档

1. 用户登录

```
    path: /user/login
    method: post
    body: {
        tel,
        password
    }
    result: {
        errcode:0,
        data:{
            token:343aerwew2423423
        }
    }
```

2. 用户注册

```
    path: /user/register
    method: post
    body: {
        tel,
        email,
        password
    }
    result: {
        errcode:0,
        data:{
            insertId:3
        }
    }
```

3. 用户ETHER余额

```
    path: /user/balance
    method: get
    result: {
        errcode:0,
        data:{
            
        }
    }
```

4. 用户代币清单

```
    path: /token/alltoken
    method: get
    result: {
        errcode:0,
        data:{
            ...
        }
    }
```
5. 用户购买ether

```
    path: /token/buycoin
    method: post
    body:{count:个数}
    result: {
        errcode:0,
        data:{
            receipt
        }
    }
```