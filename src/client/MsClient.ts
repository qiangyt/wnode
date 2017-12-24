const Errors = require('../Errors');
import * as Log from '../Logger';
const RestifyClients = require('restify-clients');
import LocalClientContext from '../ctx/LocalClientContext';
import AuthToken from '../auth/AuthToken';
import JWTAuth from '../auth/JWTAuth';
import ApiServer from '../ApiServer';
import AuthTokenCodec from '../auth/AuthTokenCodec';
import Context from '../ctx/Context';

declare module global {
    const config:any;
}


export default class MsClient {

    public $id = 'MsClient';
    public $lazy = true;
    public $init = 'init';
    public $ApiServer:ApiServer = null;
    public logger:Log.Logger = Log.create(this);
    public authCodec:AuthTokenCodec;
    public services:any = {};
    

    init() {
        this.authCodec = JWTAuth.globalAuthBean().codec();

        const cfg = global.config.service;

        for( let sname in cfg ) {
            const scfg = cfg[sname];

            const sbase = scfg.base;
            if( !sbase ) throw new Error( "bad service config: " + sname );

            const s:any = this.services[sname] = {
                isLocal: (sbase === 'http://localhost:' + global.config.server.httpPort)
            };

            if( !s.isLocal ) {
                const connectTimeout = scfg.connectTimeout;
                const requestTimeout = scfg.requestTimeout;

                s.client = RestifyClients.createJsonClient( {
                    url: sbase,
                    audit: true,
                    connectTimeout: connectTimeout ? connectTimeout : 3000,
                    requestTimeout: requestTimeout ? requestTimeout : 2000,
                    retry: false,
                    safeStringify: true,
                    followRedirects: false
                } );

                s.textClient = RestifyClients.createStringClient( {
                    url: sbase,
                    audit: true,
                    connectTimeout: connectTimeout ? connectTimeout : 3000,
                    requestTimeout: requestTimeout ? requestTimeout : 2000,
                    retry: false,
                    followRedirects: false
                } );
            }
        }
    }

    call( ctx:Context, serviceName:string, apiName:string, parameters:any, defaultAuthToken:string, isText:boolean ) {
        const me = this;
        return new Promise( function( resolve, reject ) {
            me._call( ctx, serviceName, apiName, parameters, defaultAuthToken, isText, function( err:any, result:any ) {
                if( err ) reject(err);
                else resolve(result);
            } );
        } );
    }

    _call( ctx:Context, serviceName:string, apiName:string, parameters:any, defaultAuthToken:string, isText:boolean, callback:Function ) {
        let s:any;
        let isLocal:boolean;
        if( !serviceName ) isLocal = true;
        else {
            s = this.services[serviceName];
            if( !s ) return callback( Errors.INTERNAL_ERROR.build( serviceName + ' not found' ) );
            isLocal = s.isLocal;
        }

        if( !parameters ) parameters = {};

        /* eslint func-style: "off" */
        const func = function func( err:any, result:any ) {
            if( err ) return callback( err );
            if( isText ) return callback( result, null );//TODO: how to handle errors
            if( result.code === '0' ) return callback( null, result.data );
            return callback( result, null );
        };

        if( isLocal ) {
            const def = this.$ApiServer.apiDefinitions[apiName];
            if( !def ) return callback( Errors.INTERNAL_ERROR.build( [apiName + ' not found'] ) );

            const lctx = new LocalClientContext( ctx, def, func );
            def.respond( lctx, def.spec.parameters, parameters );
        } else {
            this.resolveAuthToken(ctx, defaultAuthToken).then( function(authToken) {
                parameters.aauth = authToken;
                parameters.tid = ctx.traceId;
                parameters.psid = ctx.spanId;//previous span id

                let options:any = {
                    path: '/' + serviceName + '/' + apiName
                }
                // 内部传输保留原有的header
                if (ctx && ctx.req && ctx.req.headers) {
                    let headers = ctx.req.headers;
                    options.headers = headers;
                }

                if( isText ) {
                    s.textClient.post( options, parameters, function( err:any, req:any, res:any, result:any ) {
                        return func( err, result );
                    });
                } else {
                    s.client.post( options, parameters, function( err:any, req:any, res:any, result:any ) {
                        return func( err, result );
                    });
                }
            } );

        }
    }

    /**
     *
     */
    resolveAuthToken( ctx:Context, defaultAuthToken:string ) {
        if(defaultAuthToken) {
            return Promise.resolve(defaultAuthToken);
        }

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

