import * as http from 'http';


export default class RequestHelper {

    static normalizeIpv4( ip:string ) {
        const pos = ip.lastIndexOf(':');
        if( pos < 0 ) return ip;
        return ip.substring(pos + 1);
    }

    /**
     * 从request里读取客户端的ip。支持nginx和apache mod_proxy作为前置的反向代理
     * //TODO: 如果前置了阿里云api gateway和slb的话呢，需要部署在测试环境后调测一下。
     * 
     * nginx（apache mod_proxy类似）需做以下配置：
     * 
     * server {
     *     listen 80;
     *     server_name myibook.com.cn;
     *     location ~ ^/(WEB-INF)/ {
     *     deny all;
     * }
     *
     * location / {
     *     proxy_pass http://localhost:8888;
     *     proxy_set_header X-Real-IP $remote_addr;
     *     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     * }
     * 
     * 其中X-Forwarded-For的值是多个用逗号连接的ip，每个proxy都会把proxy ip追加进去，最左边的是原始的客户端的ip，譬如：
     * X-Forwarded-For： 192.168.11.88, 192.168.11.128, 192.168.11.126
     * 那么，客户端ip是192.168.11.88
     * 
     * 其它可能的header是：
     * Proxy-Client-IP, WL-Proxy-Client-IP, HTTP_CLIENT_IP, HTTP_X_FORWARDED_FOR
     */
    /* eslint complexity: ["error", 11] */
    static resolveClientIp( req:http.ServerRequest ) {
        let r;

        const headers = req.headers;

        if( headers ) {
            // proxied by nginx / apache mod_proxy
            r = headers['x-real-ip'];
            if( r && r.length ) return RequestHelper.normalizeIpv4(<string>r);

            const xForwardedFor = headers['x-forwarded-for'];
            if( xForwardedFor && xForwardedFor.length ) {
                for( let t of (<string>xForwardedFor).split(',') ) {
                    t = t.trim();
                    if( t.length ) return RequestHelper.normalizeIpv4(t);
                }
            }
        }
        const conn = req.connection;

        if( conn ) {
            r = conn.remoteAddress;//http
            if( r.length ) return RequestHelper.normalizeIpv4(r);
        }
        if( req.socket ) return RequestHelper.normalizeIpv4(req.socket.remoteAddress);//socket.io
        
        return undefined;
    }

}

