import ApiRole = require('../ApiRole');
import JWToken = require('./JWToken');
import SimpleAuth = require('./SimpleAuth');


export default class JWTAuth extends SimpleAuth {

    constructor() {
        super();
        this.$id = 'JWTAuth';
        this.$JWTCodec = null;
        this.$lazy = true;
    }

    codec() {
        return this.$JWTCodec;
    }

    createEmptyToken() {
        return new JWToken( null, null, [ApiRole.any] );
    }

    static globalAuthBean() {
        const cfg = global.config;
        if( !cfg.server.auth ) cfg.server.auth = 'JWTAuth';
        return global.bearcat.getBean(cfg.server.auth);
    }

}
