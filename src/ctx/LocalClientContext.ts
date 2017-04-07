import BaseContext from  './BaseContext';
import ServerContext from  './ServerContext';
import ApiDefinition from '../ApiDefinition';


export default class LocalClientContext extends BaseContext {

    constructor( public parent:ServerContext, apiDefinition:ApiDefinition, public cb:any ) {
        super(apiDefinition);
        
        if( parent ) {
            this.$auth = parent.$auth;
            this.req = parent.req;
            this.tx = parent.tx;
            this.requestId = parent.requestId;
            this.correlationId = parent.correlationId;
            this.previousRequestId = parent.previousRequestId;
        }
    }

    /**
     *
     */
    /* eslint 'no-unused-vars': 'off' */
    done( failed:boolean, result:any, status:number ) {
        if( this.tryDone() ) return;

        if( failed ) {
            this.cb( result, null );
        } else {
            this.cb( null, result );
        }
    }

    /**
     *
     */
    getCookie( cookieName:string ) {
        if( !this.parent ) return undefined;
        return this.parent.getCookie( cookieName );
    }

    /**
     *
     */
    setCookie( cookieName:string, cookieValue, path, domain, maxAge, secure, httpOnly ) {
        if( !this.parent ) return;
        this.parent.setCookie( cookieName, cookieValue, path, domain, maxAge, secure, httpOnly );
    }

    /**
     *
     */
    clearCookie( cookieName:string ) {
        if( !this.parent ) return;
        this.parent.clearCookie( cookieName );
    }

}

//Object.freeze({});
//test: mocha: should.js/expect/chai/better-assert
