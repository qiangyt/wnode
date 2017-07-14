import * as ApiRole from '../ApiRole';
import JWToken from './JWToken';
import {SimpleAuth} from './SimpleAuth';
import {JWTCodec} from './JWTCodec';

declare module global {
    const config:any;
    const bearcat:any;
}


export class JWTAuth extends SimpleAuth {

    public $id = 'JWTAuth';
    public $JWTCodec:JWTCodec = null;
    public $lazy = true;

    codec() {
        return this.$JWTCodec;
    }

    createEmptyToken() {
        return new JWToken( null, null, [ApiRole.any] );
    }

    static globalAuthBean():JWTAuth {
        const cfg = global.config;
        if( !cfg.server.auth ) cfg.server.auth = 'JWTAuth';
        return global.bearcat.getBean(cfg.server.auth);
    }

}
