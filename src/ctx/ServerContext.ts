const Errors = require('../Errors.js');
import Context from  './Context';
import LocalClientContext from  './LocalClientContext';
import * as Util from 'util';
import CodePath from '../util/CodePath';
import * as Misc from '../util/Misc';
import * as Log from '../Logger';
import ApiServer from '../ApiServer';
import ApiDefinition from '../ApiDefinition';
import * as Restify from 'restify';

let _Package:any;

declare module global {
    const config:any;
    const bearcat:any;
}


export default class ServerContext extends Context {

    constructor( public server:ApiServer, 
                 apiDefinition:ApiDefinition, 
                 public req:Restify.Request, 
                 public res:Restify.Response, 
                 public final:any ) {

        super(apiDefinition);

        this.spanId = Misc.uuid();

        const params = req.params;
        if( params ) {
            this.traceId = params.tid;
            this.previousSpanId = params.psid;
        }
        if( !this.traceId ) {
            this.traceId = Misc.uuid();
        }

        this.next = null;

        if( global.config.server.logContext ) {
            this.logger.info( {
                ctx: this,
                req: Log.config.req ? req : undefined,
                requestTime: (<any>(req))._time
            }, 'new Context' );
        }
    }

    /**
     *
     */
    getCookie( cookieName:string ) {
        return (<any>(this.req)).cookies[cookieName];
    }

    /**
     *
     */
    setCookie( cookieName:string, cookieValue:string, path:string, domain:string, maxAge:number, secure:boolean, httpOnly:false ) {
        const opts:any = {};
        if( path ) opts.path = path;
        if( domain ) opts.domain = domain;
        if( maxAge ) opts.maxAge = maxAge;
        if( secure ) opts.secure = secure;
        if( httpOnly ) opts.httpOnly = httpOnly;

        (<any>(this.res)).setCookie( cookieName, cookieValue, opts );
    }

    /**
     *
     */
    clearCookie( cookieName:string ) {
        (<any>(this.res)).clearCookie(cookieName);
    }


    setCORSHeaders() {
        const res = this.res;

        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Headers', 'aauth,Content-Type,Content-Length, Authorization, Accept,X-Requested-With');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Max-Age', '3600');
    }

    resolveContentType( isBinary:boolean ):string {
        if( this.produce ) return this.produce;

        if( this.apiDefinition.produce ) return this.apiDefinition.produce;

        if( isBinary ) return 'application/octet-stream';

        return 'application/json';
    }

    Package() {
        if( !_Package ) {
            const path = CodePath.resolve('../package.json');
            _Package = require(path);
        }
        return _Package;
    }

    /**
     *
     */
    done( failed:boolean, result:any, status:number ) {
        if( this.tryDone() ) return;

        this.result = result;

        const res = this.res;

        res.setHeader( '$version', this.Package().version );

        if( global.config.server.cors ) {
            this.setCORSHeaders();
        }

        const isBinary = Util.isBuffer(result);

        let contentType = this.resolveContentType(isBinary);
        res.setHeader( 'content-type', contentType );

        const isJsonResponse = contentType === 'application/json';
        if( isJsonResponse ) {
            if( !result ) result = {};
            result.sid = this.spanId;
            result.tid = this.traceId;
        }

        let charset = this.resolveCharset( isBinary );
        if( charset ) res.charSet(charset);

        res.send( status, result );

        this.final();

        const logObj:any = {
            ctx: this,
            responseTime: new Date().getTime()
        };
        logObj.duration = logObj.responseTime - (<any>(this)).req._time;

        if( isJsonResponse && Log.config.res ) {
            if( (<any>(res))._hasBody ) {
                logObj.responseBody = (<any>(res))._data.substring( 0, Log.config.resBodyMaxSize );
            }
            logObj.res = res;
        }

        if( global.config.server.logContext ) {
            this.logger.info( logObj, 'end Context' );
        }
    }

    resolveCharset( isBinary:boolean ):string {
        if( this.apiDefinition.charset ) return this.apiDefinition.charset;

        if( !isBinary ) return 'utf-8';

        return undefined;
    }

    /**
     * @deprecated
     */
    call( apiName:string, parameterValues:any, callback:any ) {
        const def = this.server.apiDefinitions[apiName];
        if( !def ) {
            callback( Errors.INTERNAL_ERROR.build(apiName + ' not found') );
            return;
        }

        ServerContext.call2( this, def, parameterValues, callback );
    }

    /**
     * @deprecated
     */
    static call2( parent:Context, def:ApiDefinition, parameterValues:any, callback:any ) {
        const ctx = new LocalClientContext( parent, def, callback );
        def.respond( ctx, def.spec.parameters, parameterValues );
    }

    /** {@inheritedDoc} */
    /* eslint no-process-env: "off" */
    /* eslint no-unreachable: "off" */
    isJsonResponseValid( response:any ):boolean {

        // 如果全局关闭，则不进行 JSON 验证
        const cfg = global.config.server;
        if (false === cfg.validateResponse) return true;

        // 如果 API 定义了关闭 JSON 验证，则跳过
        const def = this.apiDefinition;
        if (false === def.validateResponse) return true;

        const validationResult = this.server.$SwaggerHelper.validateResponse(def, response);
        // 验证通过
        if (validationResult.valid) return true;

        // 验证失败，线上或者 uat 环境只记录日志，总是返回成功；其它环境返回失败
        this.server.logger.error(validationResult, 'invalid json response');
        const env = process.env.NODE_ENV;
        if ('prod' === env || 'uat' === env) return true;

        return false;
    }

}

//Object.freeze({});
//test: mocha: should.js/expect/chai/better-assert
