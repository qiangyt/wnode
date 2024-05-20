import * as Crypto from 'crypto';


declare module global {
    const config:any;
}


export default class Aes128 {

    public $id = 'Aes128';
    public $init = 'init';
    public $lazy = true;
    
    public key:Buffer;
    public iv:Buffer;
    

    init() {
        const cfg = global.config.Aes128;

        this.key = Buffer.from(cfg.key, "base64");
        this.iv = Buffer.alloc(0);//cfg.iv;

        if( !this.key ) throw new Error( '<Aes128.key> is not configured' );
        if( undefined === this.iv ) throw new Error( '<Aes128.iv> is not configured' );
    }
    
    /**
     * 
     */
    encrypt( input:string) {
        const cipher = Crypto.createCipheriv( 'aes-128-ecb', this.key, this.iv );
        let result = cipher.update( input, 'utf8', "base64" );
        result += cipher.final("base64");
        return result;
    }

    /**
     * 
     */
    decrypt( encrypted:string) {        
        const decipher = Crypto.createDecipheriv('aes-128-ecb', this.key, this.iv);
        let result:string = (<any>decipher).update(encrypted, "base64", 'utf8');
        result += decipher.final('utf8');
        return result;
    }

}
