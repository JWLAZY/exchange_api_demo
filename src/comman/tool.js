module.exports = {
    success : (data) => {
        return {
            errcode: 0,
            data: data
        }
    },
    fail: (error, msg = '数据处理失败') => {
        if(error){
            return {
                errcode: 1,
                errmsg: error.message
            }
        }else{
            return {
                errcode: 1,
                errmsg: msg
            }
        }
    }
}