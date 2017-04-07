const NodeMemcached = require('node_memcached');
import Logger = require('../Logger');
import Errors = require('../Errors');


// See https://github.com/chylvina/node_memcached

export default class Memcached {

    constructor() {
        this.$id = 'Memcached';
        this.$init = 'init';
        this.$lazy = true;
        
        this.logger = Logger.create(this);
    }

    createClient( cfg ) {
        return NodeMemcached.createClient( cfg.port, cfg.host );
    }

    init() {
        this.doInit(global.config.memcached);
    }

    /**
     * 
     */
    doInit(cfg) {
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
        client.on( 'error', function(err) {
            if(err) this.logger.error( {err}, 'memcached error' );
        }.bind(this));

        client.on( 'warning', function(err) {
            if(err) this.logger.error( {err}, 'memcached warning' );
            else this.logger.warn('password was set but none is needed and if a deprecated option / function / similar is used.');
        }.bind(this));

        client.on( 'connect', function(err) {
            if(err) this.logger.error( {err}, 'memcached connect error' );
            else this.logger.info('the stream is connected to the server');
        }.bind(this));

        client.on( 'ready', function(err) {
            if(err) this.logger.error( {err}, 'memcached ready error' );
            else this.logger.info('connection is established');
        }.bind(this) );

        client.on( 'end', function(err) {
            if(err) this.logger.error( {err}, 'memcached end error' );
            else this.logger.info('an established Memcached server connection has closed');
        }.bind(this) );
    }

    /**
     * JSON编码
     */
    encodeValue( ctx, value ) {
        return JSON.stringify(value);
    }

    /**
     * JSON解码
     */
    decodeValue( ctx, value ) {
        if( value === undefined || value === null ) return value;
        
        try {
            return JSON.parse(value);//eval('(' + json + ')');
        } catch( err ) {
            if( ctx ) ctx.error( Errors.INTERNAL_ERROR, err );
            else this.logger.error( {err, ctx}, 'decode failure' );
        }
    }

    // 向 OCS 中写入数据 
    add( ctx, key, value, encode, callback ) {
        value = encode ? this.encodeValue( ctx, value ) : value;

        const client = this.client;

        if( callback ) {
            client.add( key, value, function( err, res ) { 
                if( err ) {
                    if( ctx ) return ctx.error( Errors.INTERNAL_ERROR, err, key, value );
                    return undefined;
                }
                return callback(res);
            } );
        } else {
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
    }

    /**
     * 
     */
    set( ctx, key, value, expireSeconds, encode, callback ) {
        const encodedValue = encode ? this.encodeValue( ctx, value ) : value;

        const client = this.client;

        if( expireSeconds === null || expireSeconds === undefined ) {
            expireSeconds = this.config.expireSeconds;
        }

        if( callback ) {
            client.set( key, encodedValue, expireSeconds, function( err ) {
                if( err ) {
                    if( ctx ) return ctx.error( Errors.INTERNAL_ERROR, err, key, encodedValue );
                    return undefined;
                }
                return callback(value);
            } );
        } else {
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

    /**
     * 
     */
    get( ctx, key, decode, callback ) {
        const me = this;

        if( callback ) {
            me.client.get( key, function(err, res) {
                if( err ) {
                    if( ctx ) return ctx.error( Errors.INTERNAL_ERROR, err, key );
                    return undefined;
                }
                const value = decode ? me.decodeValue( ctx, res ) : res;
                return callback(value);
            } );
        } else {
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
    }

    /**
     * 
     */
    increment( ctx, key, delta, callback ) {
        const client = this.client;

        if( callback ) {
            client.increment( key, delta, function( err ) {
                if( err ) {
                    if( ctx ) return ctx.error( Errors.INTERNAL_ERROR, err, key, delta );
                    return undefined;
                }
                callback();
            } );
        } else {
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
    }

    /**
     * 
     */
    decrement( ctx, key, delta, callback ) {
        const client = this.client;

        if( callback ) {
            client.decrement( key, delta, function( err ) {
                if( err ) {
                    if( ctx ) return ctx.error( Errors.INTERNAL_ERROR, err, key, delta );
                    return undefined;
                }
                return callback();
            } );
        } else {
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
    }


    /**
     * 
     */
    delete( ctx, key, callback ) {
        const me = this;

        if( callback ) {
            me.client.delete( key, function(err) {
                if( err ) {
                    if( ctx ) return ctx.error( Errors.INTERNAL_ERROR, err, key );
                    return undefined;
                }
                return callback();
            } );
        } else {
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
    }


    /**
     * 
     */
    replace( ctx, key, value, expireSeconds, encode, callback ) {
        const encodedValue = encode ? this.encodeValue( ctx, value ) : value;

        const client = this.client;

        if( expireSeconds === null || expireSeconds === undefined ) {
            expireSeconds = this.config.expireSeconds;
        }

        if( callback ) {
            client.replace( key, encodedValue, expireSeconds, function( err ) {
                if( err ) {
                    if( ctx ) return ctx.error( Errors.INTERNAL_ERROR, err, key, encodedValue );
                    return undefined;
                }
                return callback(value);
            } );
        } else {
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
  
}

