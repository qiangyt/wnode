import AuthToken from './AuthToken';


export default class JWToken extends AuthToken {

    /**
     * 
     */
    internalCopy() {
        return new JWToken( this.userId, this.orgId, this.expireByMinutes, this.roles, this.data, true );
    }

}
