const AliyunSdk = require('@wxcount/aliyun-sdk');
 

// See https://github.com/chylvina/node_memcached

export default class AliMemcached extends require('./Memcached') {

    constructor() {
        super();
        this.$id = 'AliMemcached';
    }

    /**
     * 
     */
    init() {
        const cfg = global.config.aliyun.memcached;
        super.init(cfg);
    }

    createClient( cfg ) {
         return AliyunSdk.MEMCACHED.createClient( cfg.port, cfg.host );
    }
  
}


