const AliyunSdk = require('waliyun-sdk');
import Memcached from './Memcached';

declare module global {
    const config:any;
}


// See https://github.com/chylvina/node_memcached

export default class AliMemcached extends Memcached {

    public $id = 'AliMemcached';

    /**
     * 
     */
    init() {
        this.doInit(global.config.aliyun.memcached);
    }

    createClient( cfg:any ) {
         return AliyunSdk.MEMCACHED.createClient( cfg.port, cfg.host );
    }
  
}
