const Errors = require('../Errors');
import Exception from '../Exception';
import * as ApiRole from '../ApiRole';
import AuthToken from './AuthToken';
import * as Log from '../Logger';
import AuthTokenCodec from './AuthTokenCodec';
import Context from '../ctx/Context';
import ApiDefinition from '../ApiDefinition';
import * as Restify from 'restify';


export default class SimpleAuth {

    public $id = 'SimpleAuth';
    public $AuthTokenCodec:AuthTokenCodec = null;
    public $lazy = true;

    public logger:Log.Logger = Log.create(this);


    codec() {
        return this.$AuthTokenCodec;
    }

    /**
     * @param req the context object
     * @param def the ApiDefinition object
     * @param req the request object
     */
    auth( ctx:Context, def:ApiDefinition, req:Restify.Request ) {
        const me = this;
        const token = this.resolveToken( ctx, req );
        this.logger.debug( {token, ctx}, 'decoding token' );
        
        return this.decode( ctx, token ).then( function(auth:AuthToken) {
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

    resolveToken( ctx:Context, req:Restify.Request ) {
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
    decode( ctx:Context, token:string ) {
        if( !token ) return Promise.resolve(this.createEmptyToken());
        return this.codec().decode(ctx, token);
    }

    createEmptyToken() {
        return new AuthToken( null, null, [ApiRole.any], null, false );
    }

}

