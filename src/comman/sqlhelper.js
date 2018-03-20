/**
 *  mysql 工具
 */
const mysql = require('mysql');

// 获取配置信息
const config = require('../config/index').getConfig();
const mysqlconfig = config.mysql;


// 创建连接池
const pool = mysql.createPool(mysqlconfig);

module.exports = {
    // 不带参数的查询
    query: (sql, callback) => {
        // 获取一个sql 连接
        pool.getConnection((error,connection) => {
            if(error){
                console.log('连接数据失败');
                callback(error);
                connection.release()
            }else{
                // 执行查询
                connection.query(sql, (error, result) => {
                    if(error){
                        callback(error);
                    }else{
                        callback(null, result);
                    }
                    connection.release()
                })
            }
        })
    },
    // 带参数的查询
    query_objc: (sql, objc, callback) => {
        // let sql = "insert into table (name,password) value (?,?);"
        pool.getConnection((error, connection) => {
            if(error){
                callback(error);
                connection.release()
            }else{
                // 执行带参数的sql语句
                connection.query(sql, objc, (error, result) => {
                    if(error){
                        callback(error);
                    }else{
                        callback(null, result);
                    }
                    connection.release()
                })
            }
        })
    }
}
