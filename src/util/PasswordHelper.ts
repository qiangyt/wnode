import Crypto = require('crypto');


export default class PasswordHelper {

    static generateSalt() {
        const r = Math.random() * 1000000000;
        return Math.floor(r);
    }

    static hash( password, salt ) {
        const hash = Crypto.createHash('sha256');
        hash.update( password + '-' + salt );
        return hash.digest('base64');
    }

    static verify( passwordInput, salt, hashedPassword ) {
        const hashedPasswordToVerify = PasswordHelper.hash( passwordInput, salt );
        return hashedPasswordToVerify === hashedPassword;
    }

}

