//@see http://www.cxyclub.cn/n/35566/

//Directly send cookie to system, if it's node.js handler, send :
//request.headers.cookie
//If it's socket.io cookie, send :
//client.request.headers.cookie
module.exports.Cookie = function(co){
    this.cookies = {};
    co.split(';').forEach(function(cookie){
        const parts = cookie.split('=');
        this.cookies[parts[0].trim()] = (parts[1] || '').trim();
    }.bind(this));

    //Retrieve all cookies available
    this.list = function(){
        return this.cookies;
    };

    //Retrieve a key/value pair
    this.get = function(key){
        if(this.cookies[key]){
            return this.cookies[key];
        }
        // QiangYiting: 最初的版本（http://www.cxyclub.cn/n/35566/）里，取不到指定的cookie时会返回一个｛｝，
        // 这不方便调用方判断是否成功读取到该cookie。所以，我们改为return undefined.
        return undefined;
    };

    //Retrieve a list of key/value pair
    this.getList = function(map){
        const cookieRet = {};
        for(let i=0; i<map.length; i++){
            if(this.cookies[map[i]]){
                cookieRet[map[i]] = this.cookies[map[i]];
            }
        }
        return cookieRet;
    };
};
