import * as Crypto from 'crypto';


declare module global {
    const config:any;
}


export default class Aes128 {

    public $id = 'Aes128';
    public $init = 'init';
    public $lazy = true;
    
    public key:string;
    public iv:string;
    

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
    encrypt( input:string, encode:string ) {
        if( !encode ) encode = 'base64';

        const cipher = Crypto.createCipheriv( 'aes-128-ecb', this.key, this.iv );
        let result = (<any>cipher).update( input, 'utf8', encode );
        result += cipher.final(encode);
        return result;
    }

    /**
     * 
     */
    decrypt( encrypted:string, encode:string ) {
        if( !encode ) encode = 'base64';
        
        const decipher = Crypto.createDecipheriv('aes-128-ecb', this.key, this.iv);
        let result:string = (<any>decipher).update(encrypted, encode, 'utf8');
        result += decipher.final('utf8');
        return result;
    }

}
