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