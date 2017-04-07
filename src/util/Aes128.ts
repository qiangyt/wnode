import * as Crypto from 'crypto';


export default class Aes128 {

    constructor() {
        this.$id = 'Aes128';
        this.$init = 'init';
        this.$lazy = true;
    }

    init() {
        const cfg = global.config.Aes128;

        this.key = cfg.key;
        this.iv = cfg.iv;

        if( !this.key ) throw new Error( '<Aes128.key> is not configured' );
        if( undefined === this.iv ) throw new Error( '<Aes128.iv> is not configured' );
    }
    
    /**
     * 
     */
    encrypt( input, encode ) {
        if( !encode ) encode = 'base64';

        const cipher = Crypto.createCipheriv( 'aes-128-ecb', this.key, this.iv );
        let result = cipher.update( input, 'utf8', encode );
        result += cipher.final(encode);
        return result;
    }

    /**
     * 
     */
    decrypt( encrypted, encode ) {
        if( !encode ) encode = 'base64';
        
        const decipher = Crypto.createDecipheriv('aes-128-ecb', this.key, this.iv);
        let result = decipher.update(encrypted, encode, 'utf8');
        result += decipher.final('utf8');
        return result;
    }

}
