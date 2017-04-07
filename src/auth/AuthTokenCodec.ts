import AuthToken = require('./AuthToken');


export default class AuthTokenCodec {

    constructor() {
        this.$id = 'AuthTokenCodec';
        this.$Aes128 = null;
        this.$lazy = true;
    }

    /**
     * 编码
     */
    encode( token ) {
        const me = this;
        return new Promise( function(resolve) {
            const raw = {
                i: token.userId,
                e: token.expireByMinutes,
                r: token.roles,
                d: token.data,
                x: token.internal
            };
            const json = JSON.stringify(raw);
            resolve( me.$Aes128.encrypt(json, 'base64') );
        } );
    }

    /**
     * 解码
     */
    decode( ctx, tokenText ) {
        const me = this;
        return new Promise( function( resolve ) {
            const json = me.$Aes128.decrypt(tokenText, 'base64');
            const raw = JSON.parse(json);
            resolve( new AuthToken( raw.i, raw.e, raw.r, raw.d, raw.x ) );
        } );
    }

}

