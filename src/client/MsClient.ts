import Errors = require('../Errors');
import Logger = require('../Logger');
import Restify = require('restify');
import LocalClientContext = require('../ctx/LocalClientContext');
import AuthToken = require('../auth/AuthToken');
import JWTAuth = require('../auth/JWTAuth');


export default class MsClient {

    constructor() {
        this.$id = 'MsClient';
        this.$lazy = true;
        this.$init = 'init';
        this.$ApiServer = null;

        this.logger = Logger.create(this);
    }


    init() {
        this.authCodec = JWTAuth.globalAuthBean().codec();

        const cfg = global.config.service;
        this.services = {};

        for( let sname in cfg ) {
            const scfg = cfg[sname];

            const sbase = scfg.base;
            if( !sbase ) throw new Error( "bad service config: " + sname );

            const s = this.services[sname] = {
                isLocal: (sbase === 'http://localhost:' + global.config.server.httpPort)
            };

            if( !s.isLocal ) {
                const connectTimeout = scfg.connectTimeout;
                const requestTimeout = scfg.requestTimeout;

                s.client = Restify.createJsonClient( {
                    url: sbase,
                    connectTimeout: connectTimeout ? connectTimeout : 3000,
                    requestTimeout: requestTimeout ? requestTimeout : 2000
                } )
            }
        }
    }

    call( ctx, serviceName, apiName, parameters, callback ) {
        if( callback ) {
            this._call( ctx, serviceName, apiName, parameters, function( err, result ) {
                if( err ) return ctx.error(err);
                return callback(result);
            } );
        } else {
            const me = this;
            return new Promise( function( resolve, reject ) {
                me._call( ctx, serviceName, apiName, parameters, function( err, result ) {
                    if( err ) reject(err);
                    else resolve(result);
                } );
            } );
        }
    }

    _call( ctx, serviceName, apiName, parameters, callback ) {
        let s;
        let isLocal;
        if( !serviceName ) isLocal = true;
        else {
            s = this.services[serviceName];
            if( !s ) return callback( Errors.INTERNAL_ERROR.build( serviceName + ' not found' ) );
            isLocal = s.isLocal;
        }

        if( !parameters ) parameters = {};

        /* eslint func-style: "off" */
        const func = function func( err, result ) {
            if( err ) return callback( err );
            if( result.code === '0' ) return callback( null, result.data );
            return callback( result, null );
        };

        if( isLocal ) {
            const def = this.$ApiServer.apiDefinitions[apiName];
            if( !def ) return callback( Errors.INTERNAL_ERROR.build( [apiName + ' not found'] ) );

            const lctx = new LocalClientContext( ctx, def, func );
            def.respond( lctx, def.spec.parameters, parameters );
        } else {
            this.resolveInternalAuthToken(ctx).then( function(internalAuthToken) {
                parameters.aauth = internalAuthToken;
                parameters.cid = ctx.correlationId;//correlation id
                parameters.prid = ctx.requestId;//previous request id

                let options = {
                    path: '/' + serviceName + '/' + apiName
                }
                // 内部传输保留原有的header
                if (ctx && ctx.req && ctx.req.headers) {
                    let headers = ctx.req.headers;
                    options.headers = headers;
                }
                s.client.post( options, parameters, function( err, req, res, result ) {
                    return func( err, result );
                });
            } );

        }
    }

    /**
     *
     */
    resolveInternalAuthToken( ctx ) {
        if( !ctx.$authInternal ) {
            ctx.$authInternal = ( ctx.$auth ) ? ctx.$auth.internalCopy() : new AuthToken( null, null, null, null, true );
        }

        if( !ctx.$encodedAuthInternal ) {
            return this.authCodec.encode(ctx.$authInternal).then( function(encoded) {
                ctx.$encodedAuthInternal = encoded;
                return encoded;
            } );
        }

        return Promise.resolve(ctx.$encodedAuthInternal);
    }


}

