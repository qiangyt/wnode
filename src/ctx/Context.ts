const Errors = require('../Errors');
import ErrorType from '../ErrorType';
import Exception from  '../Exception.js';
import * as Util from 'util';
import * as Log from '../Logger';
const logger = Log.create('ctx');
import Transaction from './Transaction';
import ApiDefinition from '../ApiDefinition';
import JWTAuth from '../auth/JWTAuth';
import AuthToken from '../auth/AuthToken';
import * as http from 'http';

declare module global {
    const config:any;
}


export default class Context {

    public $auth:AuthToken = JWTAuth.globalAuthBean().createEmptyToken();
    public $authToken:string;
    public isTxOwner = false;
    public logger:Log.Logger;
    public req:http.ServerRequest;
    public next:any;
    public tx:Transaction;
    public isDone = false;
    public values:any;
    public result:any;
    public hasError = false;
    public errorCallback:any;
    public spanId:string;
    public traceId:string;
    public previousSpanId:string;
    public beginTime = new Date().getTime();
    public $authInternal:AuthToken;
    public $encodedAuthInternal:string;
    public bean:any;    
    public produce:string;


    constructor( public apiDefinition:ApiDefinition ) {
        this.logger = logger;
    }


    callback( cb:any ) {
        try {
            const args = Array.from(arguments).slice(1);
            cb.apply( null, args );
            return true;
        } catch( err ) {
            this.error(err);
            return false;
        }
    }


    beginTx( options:any ) {
        return this._beginTx(options);
    }


    _beginTx( options:any ) {
        if( !this.tx ) {
            this.tx = new Transaction( this, options );
            this.isTxOwner = true;
            this.tx.startRollbackTimer();
        }

        // 当前context下已经有事务，那么，不需要重复初始化事务。
        // TODO：根据支持的事务的scope的不同，做不同的检查

        return this;
    }


    commitTx() {
        if( this.isTxOwner ) {
            const tx = this.tx;
            this.tx = undefined;
            this.isTxOwner = false;

            if( tx ) {
                try {
                    return tx.commit();
                } catch ( err ) {
                    logger.error( {err, ctx:this}, 'error occurred during transaction commit' );
                    return Promise.reject(err);
                }
            }
        }
        return Promise.resolve();
    }


    rollbackTx() {
        if( this.isTxOwner ) {
            const tx = this.tx;
            this.tx = undefined;
            this.isTxOwner = false;

            if( tx ) {
                try {
                    return tx.rollback();
                } catch ( err ) {
                    logger.fatal( {err, ctx:this}, 'error occurred during transaction rollback' );
                    return Promise.reject(err);
                }
            }
            return Promise.resolve();
        }
    }

    /**
     * 通知客户端本次服务调用成功。
     *
     * @param result 返回的数据。可以为undefined，表示无结果
     *
     * 对于HTTP/JSON协议：
     * 1. 返回的HTTP状态码是200
     *
     * 2. 返回的JSON数据格式如下：
     *    {
     *        code: 0,
     *        data: <result的json编码>
     *    }
     */
    ok( result?:any ) {
        if( this.tx ) {
            return this.commitTx()
                .then( () => this._ok(result) )
                .catch( (err:any) => {
                    logger.error( {err, ctx:this}, 'more error during transaction commit' );
                    this._error.apply( this, arguments );
                } );
        }

        this._ok(result);
    }


    _ok( result:any ) {
        if( !this.next ) {
            // 本次API调用结束
            const status = 200;
            if( Util.isBuffer(result) || !this.apiDefinition.isJson ) {
                this.done( false, result, status );
            } else if( this.apiDefinition.customizeJsonResponse ) {
                if( !this.isJsonResponseValid(result) ) {
                    this.error( Errors.INVALID_RESPONSE, JSON.stringify(result) );
                } else {
                    this.done( false, result, status );
                }
            } else {
                if( !this.isJsonResponseValid(result) ) {
                    this.error( Errors.INVALID_RESPONSE, JSON.stringify(result) );
                } else {
                    const response = {code: '0', data:result, time: new Date().getTime()};
                    this.done( false, response, status );
                }
            }
            return;
        }

        // 如果本次API调用还未结束，那么把当前步骤的执行结果合并到this.values里，以便后续步骤使用
        if( result) {
          Object.assign( this.values, result );
        }

        this.next( this );
    }


    /*eslint no-unused-vars: "off"*/
    isJsonResponseValid( response:any ) {
        return true;
    }


    /** 返回false表示此次request还未处理完成 */
    tryDone() {
        if( this.isDone ) {
            logger.warn( {result:this.result, ctx:this}, 'result after responded' );
            return true;
        }
        this.isDone = true;
        return false;
    }


    /**
     * 通知客户端本次服务调用失败。
     *
     * 第一个参数是错误类型，例如Errors.INTERNAL_ERROR，其余参数是可变参数，由错误类型确定，@see framework/Errors.json。
     *
     * 对于HTTP/JSON协议：
     * 1. 返回的HTTP状态码：200
     *
     * 2. 返回的JSON数据格式如下：
     *    {
     *        code:     <出错代码，整数字符串，非零>,
     *        key:      <出错标示，字符串>,
     *        message:  <错误提示文字，字符串>,
     *        time:     <错误发生时间点，长整数，毫秒值>
     *    }
     */
    error(...params:any[]) {
        if( this.tx ) {
            return this.rollbackTx()
            .then( () => {
                this._error.apply( this, arguments );
            } )
            .catch( (err:any) => {
                logger.warn( {err, ctx:this}, 'more error during transaction rollback' );
                this._error.apply( this, arguments );
            } );
        }

        this._error.apply( this, arguments );
    }


    _error() {
        this.hasError = true;

        let msg;

        let labelOrError:any = arguments[0];

        if( labelOrError instanceof Exception ) {
            let args = [];
            if( labelOrError.data ) args.push(labelOrError.data);
            if( labelOrError.args ) args = args.concat(labelOrError.args);

            if( global.config.server.printStackTraceAlways ) {
                labelOrError.ctx = this;
                logger.error( labelOrError, labelOrError.message );
            }

            this.error.apply(this, args);
            return;
        } else if( labelOrError instanceof ErrorType ) {
            // already a Error.Label
            const args = Array.from(arguments).slice(1);

            if(labelOrError === Errors.INTERNAL_ERROR) {
                msg = Errors.INTERNAL_ERROR.build();
                logger.error( Object.assign( {args, ctx:this}, msg ) );
            } else {
                msg = labelOrError.build(args);
                logger.warn( Object.assign( {args, ctx:this}, msg ) );
            }
        } else if( labelOrError.code && labelOrError.message && labelOrError.key ) {
            msg = labelOrError;
        } else {
            msg = Errors.INTERNAL_ERROR.build();

            if( Util.isError(labelOrError) ) {
                logger.error( Object.assign( {stack: labelOrError.stack, ctx: this}, msg ), labelOrError.message );   // print the stack trace
            } else {
                logger.error( Object.assign( {args: arguments, ctx: this}, msg ) );
            }
        }

        this.done( true, msg, 200 );

        if( this.errorCallback ) {
            this.errorCallback(labelOrError);
        }
    }


    done( failed:boolean, result:any, status:number ):void {
        throw new Error('to be implemented');
    }
    

    getCookie( cookieName:string ):string {
        return undefined;
    }

    /**
     *
     */
    setCookie( cookieName:string, cookieValue:string, path:string, domain:string, maxAge:number, secure:boolean, httpOnly:boolean ) {
        return;
    }

    /**
     *
     */
    clearCookie( cookieName:string ) {
        return;
    }

}

