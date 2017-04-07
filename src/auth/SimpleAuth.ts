import * as Errors from '../Errors';
import Exception from '../Exception';
import * as ApiRole from '../ApiRole';
import AuthToken from './AuthToken';
import * as Logger from '../Logger';
import AuthTokenCodec from './AuthTokenCodec';
import BaseContext from '../ctx/BaseContext';
import ApiDefinition from '../ApiDefinition';
import {ServerRequest} from 'http';


export default class SimpleAuth {

    public $id = 'SimpleAuth';
    public $AuthTokenCodec:AuthTokenCodec = null;
    public $lazy = true;

    public logger = Logger.create(this);


    codec() {
        return this.$AuthTokenCodec;
    }

    /**
     * @param req the context object
     * @param def the ApiDefinition object
     * @param req the request object
     */
    auth( ctx:BaseContext, def:ApiDefinition, req:ServerRequest ) {
        const me = this;
        const token = this.resolveToken( ctx, req );
        this.logger.debug( {token, ctx}, 'decoding token' );
        
        return this.decode( ctx, token ).then( function(auth) {
            ctx.$auth = auth;
            
            const authResult = auth.hasRoles(def.roles);
            if( authResult.ok ) return;

            const absentRoleNames = ApiRole.byValueArray(authResult.absentRoles)
            throw new Exception( Errors.NO_PERMISSION, absentRoleNames );
        } ).catch( function(err) {
            if( err instanceof Exception ) throw err;

            if( 'TokenExpiredError' === err.name ) throw new Exception( Errors.EXPIRED_AUTH_TOKEN );
            
            me.logger.error( {err, ctx, token}, 'failed to decode auth token' );
            throw new Exception( Errors.INVALID_AUTH_TOKEN );
        } );
    }

    resolveToken( ctx:BaseContext, req:ServerRequest ) {
        const params = req.params;

        let token;

        /* eslint max-depth: ["error", 5] */
        if( params ) {
            token = params.aauth;
            if( !token ) {
                const headers = req.headers;
                if( headers ) {
                    token = headers.aauth;
                    if( !token ) {
                        const authorizationHeader = headers.authorization;
                        if( authorizationHeader && authorizationHeader.indexOf('aauth ', 0) === 0 ) {
                            token = authorizationHeader.substring('aauth '.length);
                        }
                    }
                }
            }
        }

        return token;
    }

    /**
     * @param req the request object
     */
    decode( ctx:BaseContext, token:string ) {
        if( !token ) return Promise.resolve(this.createEmptyToken());
        return this.codec().decode(ctx, token);
    }

    createEmptyToken() {
        return new AuthToken( null, null, [ApiRole.any], null, false );
    }

}

