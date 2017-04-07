const AliyunSdk = require('@wxcount/aliyun-sdk');
import Memcached from './Memcached';


// See https://github.com/chylvina/node_memcached

export default class AliMemcached extends Memcached {

    public $id = 'AliMemcached';

    /**
     * 
     */
    init() {
        const cfg = global.config.aliyun.memcached;
        super.init(cfg);
    }

    createClient( cfg:any ) {
         return AliyunSdk.MEMCACHED.createClient( cfg.port, cfg.host );
    }
  
}


