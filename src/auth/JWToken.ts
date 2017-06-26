import {AuthToken} from './AuthToken';


export class JWToken extends AuthToken {

    /**
     * 
     */
    internalCopy() {
        return new JWToken( this.userId, this.expireByMinutes, this.roles, this.data, true );
    }

}

