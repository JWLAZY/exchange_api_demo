
module.exports = {
    getConfig: () => {
        //获取node 运行环境
        // node 运行时可以设置
        let env = process.env['NODE_ENV'];
        if(env == "reslease"){
            // 返回正式环境
            return require('./config');
        }else{
            // 返回测试环境
            return require('./config.dev');
        }
    }
}
