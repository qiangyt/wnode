import Context from  './Context';
import ApiDefinition from '../ApiDefinition';


export default class LocalClientContext extends Context {

    constructor( public parent:Context, apiDefinition:ApiDefinition, public cb:any ) {
        super(apiDefinition);
        
        if( parent ) {
            this.$auth = parent.$auth;
            this.$authToken = parent.$authToken;
            this.req = parent.req;
            this.tx = parent.tx;
            this.spanId = parent.spanId;
            this.traceId = parent.traceId;
            this.previousSpanId = parent.previousSpanId;
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
    setCookie( cookieName:string, cookieValue:string, path:string, domain:string, maxAge:number, secure:boolean, httpOnly:boolean ) {
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
