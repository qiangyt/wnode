const NodeMemcached = require('node_memcached');
import * as Logger from '../Logger';
import * as Errors from '../Errors';
import BaseContext from '../ctx/BaseContext';

declare module global {
    const config:any;
}


// See https://github.com/chylvina/node_memcached

export default class Memcached {

    public $id = 'Memcached';
    public $init = 'init';
    public $lazy = true;
    public logger = Logger.create(this);
    public config:any;
    public client:any;

    createClient( cfg:any ) {
        return NodeMemcached.createClient( cfg.port, cfg.host );
    }


    init() {
        this.doInit(global.config.memcached);
    }

    /**
     * 
     */
    doInit(cfg:any) {
        this.config = cfg;

        if( !cfg.host ) throw new Error( '<memcached.host> not configured' );

        if( undefined === cfg.port ) {
            cfg.port = 11211;
            this.logger.info( 'because <memcached.port> is undefined, it is set to default value: ' + cfg.port );
        }

        if( !cfg.expireSeconds || cfg.expireSeconds <= 0 ) {
            cfg.expireSeconds = 10;
            this.logger.info( 'because <memcached.expireSeconds> is undefined or invalid, it is set to default value: ' + cfg.expireSeconds );
        }

        this.logger.info( cfg, 'configuration' );

        // 创建 OCS 的 memcached 实例 
        // 其中，host 为实例的 ip 地址 
        const client = this.client = this.createClient(cfg);

        // 如果 client 发送了这个事件而没有被侦听，那么将会导致 node 进程退出。因此必须在创建 client 的时候主动侦听该事件并作出相应处理
        client.on( 'error', (err:any) => {
            if(err) this.logger.error( {err}, 'memcached error' );
        });

        client.on( 'warning', (err:any) => {
            if(err) this.logger.error( {err}, 'memcached warning' );
            else this.logger.warn('password was set but none is needed and if a deprecated option / function / similar is used.');
        });

        client.on( 'connect', (err:any) => {
            if(err) this.logger.error( {err}, 'memcached connect error' );
            else this.logger.info('the stream is connected to the server');
        });

        client.on( 'ready', (err:any) => {
            if(err) this.logger.error( {err}, 'memcached ready error' );
            else this.logger.info('connection is established');
        });

        client.on( 'end', (err:any) => {
            if(err) this.logger.error( {err}, 'memcached end error' );
            else this.logger.info('an established Memcached server connection has closed');
        });
    }

    /**
     * JSON编码
     */
    encodeValue( ctx:BaseContext, value:any ) {
        return JSON.stringify(value);
    }

    /**
     * JSON解码
     */
    decodeValue( ctx:BaseContext, value:any ) {
        if( value === undefined || value === null ) return value;
        
        try {
            return JSON.parse(value);//eval('(' + json + ')');
        } catch( err ) {
            if( ctx ) ctx.error( Errors.INTERNAL_ERROR, err );
            else this.logger.error( {err, ctx}, 'decode failure' );
        }
    }

    // 向 OCS 中写入数据 
    add( ctx:BaseContext, key:string, value:any, encode:boolean ) {
        value = encode ? this.encodeValue( ctx, value ) : value;

        const client = this.client;

        return new Promise(function( resolve, reject ) {
            client.add( key, value, function( err, res ) { 
               if( err ) {
                    if( ctx ) ctx.error( Errors.INTERNAL_ERROR, err, key, value );
                    reject(err);
                   } else {
                    resolve(res);
                }
            } );
        });
    }

    /**
     * 
     */
    set( ctx:BaseContext, key:string, value:any, expireSeconds:number, encode:boolean ) {
        const encodedValue = encode ? this.encodeValue( ctx, value ) : value;

        const client = this.client;

        if( expireSeconds === null || expireSeconds === undefined ) {
            expireSeconds = this.config.expireSeconds;
        }

            return new Promise(function( resolve, reject ) {
                client.set( key, encodedValue, expireSeconds, function( err ) {
                    if( err ) {
                        if( ctx ) ctx.error( Errors.INTERNAL_ERROR, err, key, encodedValue );
                        reject(err);
                    } else {
                        resolve(value);
                    }
                } );
            } );
    }

    /**
     * 
     */
    get( ctx:BaseContext, key:string, decode:boolean ) {
        const me = this;

            return new Promise(function( resolve, reject ) {
                me.client.get( key, function(err, res) {
                    if( err ) {
                        if( ctx ) ctx.error( Errors.INTERNAL_ERROR, err, key );
                        reject(err);
                    } else {
                        const value = decode ? me.decodeValue( ctx, res ) : res;
                        resolve(value);
                    }
                } );
            });
    }

    /**
     * 
     */
    increment( ctx:BaseContext, key:string, delta:number ) {
        const client = this.client;

            return new Promise(function( resolve, reject ) {
                client.increment( key, delta, function( err ) {
                    if( err ) {
                        if( ctx ) ctx.error( Errors.INTERNAL_ERROR, err, key, delta );
                        reject(err);
                    } else {
                        resolve();
                    }
                } );
            });
    }

    /**
     * 
     */
    decrement( ctx:BaseContext, key:string, delta:number ) {
        const client = this.client;

            return new Promise(function( resolve, reject ) {
                client.decrement( key, delta, function( err ) {
                    if( err ) {
                        if( ctx ) ctx.error( Errors.INTERNAL_ERROR, err, key, delta );
                        reject(err);
                    } else {
                        resolve();
                    }
                } );
            });
    }


    /**
     * 
     */
    delete( ctx:BaseContext, key:string ) {
        const me = this;

            return new Promise(function( resolve, reject ) {
                me.client.delete( key, function(err) {
                    if( err ) {
                        if( ctx ) ctx.error( Errors.INTERNAL_ERROR, err, key );
                        reject(err);
                    } else {
                        resolve();
                    }
                } );
            });
    }


    /**
     * 
     */
    replace( ctx:BaseContext, key:string, value:any, expireSeconds:number, encode:boolean ) {
        const encodedValue = encode ? this.encodeValue( ctx, value ) : value;

        const client = this.client;

        if( expireSeconds === null || expireSeconds === undefined ) {
            expireSeconds = this.config.expireSeconds;
        }

        
            return new Promise(function( resolve, reject ) {
                client.set( key, encodedValue, expireSeconds, function( err ) {
                    if( err ) {
                        if( ctx ) ctx.error( Errors.INTERNAL_ERROR, err, key, encodedValue );
                        reject(err);
                    } else {
                        resolve(value);
                    }
                } );
            } );
    }
  
}

