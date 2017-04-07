import BaseContext = require( './BaseContext' );


export default class LocalClientContext extends BaseContext {

    constructor( parent, apiDefinition, cb ) {
        super(apiDefinition);
        this.parent = parent;
        if( parent ) {
            this.$auth = parent.$auth;
            this.req = parent.req;
            this.tx = parent.tx;
            this.requestId = parent.requestId;
            this.correlationId = parent.correlationId;
            this.previousRequestId = parent.previousRequestId;
        }
        this.cb = cb;
        this.beginTime = new Date().getTime();
    }

    /**
     *
     */
    /* eslint 'no-unused-vars': 'off' */
    done( failed, result, status ) {
        if( this.tryDone() ) return;

        let error;
        if( failed ) {
            this.cb( result, null );
        } else {
            this.cb( null, result );
        }
    }

    /**
     *
     */
    getCookie( cookieName ) {
        if( !this.parent ) return undefined;
        return this.parent.getCookie( cookieName );
    }

    /**
     *
     */
    setCookie( cookieName, cookieValue, path, domain, maxAge, secure, httpOnly ) {
        if( !this.parent ) return;
        this.parent.setCookie( cookieName, cookieValue, path, domain, maxAge, secure, httpOnly );
    }

    /**
     *
     */
    clearCookie( cookieName ) {
        if( !this.parent ) return;
        this.parent.clearCookie( cookieName );
    }

}

//Object.freeze({});
//test: mocha: should.js/expect/chai/better-assert
