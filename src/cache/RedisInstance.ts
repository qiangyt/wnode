const Redis = require('redis');
import * as Log from '../Logger';
const Errors = require('../Errors');
import Exception from '../Exception';
const Bluebird = require('bluebird');
import * as Util from 'util';
import Context from '../ctx/Context';


Bluebird.promisifyAll(Redis.RedisClient.prototype);
Bluebird.promisifyAll(Redis.Multi.prototype);


// See https://github.com/NodeRedis/node_redis

export default class RedisInstance {

    public logger:Log.Logger;
    public client:any;

    constructor(public instanceName:string, public config:any) {
        this.logger = Log.create('RedisInstance/' + (instanceName ? instanceName : '') );

        this.connect();
    }

    /**
     *
     */
    connect() {
        let cfg = this.config;

        if( !cfg ) cfg = this.config = {};
        if( !cfg.host ) cfg.host = '127.0.0.1';
        if( !cfg.port ) cfg.port = 6379;
        if( !cfg.db ) cfg.db = 0;
        if( !cfg.connect_timeout ) cfg.connect_timeout = 10000;

        this.logger.info( cfg, 'configuration' );

        const client = this.client = Redis.createClient(cfg);

        client.on( 'error', (err:any) => {
            if(err) this.logger.error( {err}, 'redis error' );
        });

        client.on( 'connect', (err:any) => {
            if(err) this.logger.error( {err}, 'redis connect err' );
            else this.logger.info('connected to the server');
        });

        client.on( 'reconnecting', (err:any) => {
            if(err) this.logger.error( {err}, 'redis reconnecting error' );
            else this.logger.info('trying to reconnect to the Redis server after losing the connection');
        });

        client.on( 'ready', (err:any) => {
            if(err) this.logger.error( {err}, 'redis ready error' );
            else this.logger.info('connection is established');
        });

        client.on( 'end', (err:any) => {
            if(err) this.logger.error( {err}, 'redis end error' );
            else this.logger.info('an established Redis server connection has closed');
        } );
    }

    /**
     * JSON编码
     */
    encodeValue( ctx:Context, value:any ) {
        return JSON.stringify(value);
    }

    /* eslint no-empty: "off" */
    encodeObjectArray( ctx:Context, objectArray:any[] ) {
        //const r = {};
        //for( let key in objectArray ) {
//
  //      }
    }

    /**
     * JSON解码
     */
    decodeValue( ctx:Context, value:string ) {
        if( value === undefined || value === null ) return value;

        try {
            return JSON.parse(value);//eval('(' + json + ')');
        } catch( err ) {
            this.logger.error( {err, ctx}, 'decode failure' );
            throw new Exception( Errors.INTERNAL_ERROR, err );
        }
    }

    decodeValueArray( ctx:Context, valueArray:string[] ) {
        if( valueArray === undefined || valueArray === null ) return valueArray;

        return valueArray.map( value => this.decodeValue(ctx, value) );
    }

    /**
     *
     */
    set( ctx:Context, key:string, value:any, expireSeconds:number, encode:boolean ) {
        const encodedValue = encode ? this.encodeValue( ctx, value ) : value;
        return this.client.setAsync( key, encodedValue )
        .then( (res:any) => {
            if( expireSeconds !== null && expireSeconds !== undefined && expireSeconds > 0 ) {
                return this.client.expire( key, expireSeconds );
            }
            return res;
        });
    }

    /**
     *
     */
    get( ctx:Context, key:string, decode:boolean ) {
        return this.client.getAsync(key)
        .then( (res:any) => {
            const value = decode ? this.decodeValue( ctx, res ) : res;
            return value;
        } );
    }

    /**
     *
     */
    incrby( ctx:Context, key:string, delta:number ) {
        return this.client.incrbyAsync( key, delta );
    }

    /**
     *
     */
    decrby( ctx:Context, key:string, delta:number ) {
        return this.client.decrbyAsync( key, delta );
    }

    /**
     * @param keyOrKeyArray 单个key，或key的数组
     */
    del( ctx:Context, keyOrKeyArray:string|string[] ) {
        // 删除支持数组
        return this.client.delAsync( keyOrKeyArray );
    }

    mget( ctx:Context, keyOrKeyArray:string|string[] ) {
        let p;
        if( !Util.isArray(keyOrKeyArray) ) {
            keyOrKeyArray = Array.from(arguments).slice(1);
        }
        p = this.client.mgetAsync.apply( null, keyOrKeyArray );
        p.then( (valueArray:string[]) => this.decodeValueArray( ctx, valueArray ) );
    }

    /* eslint no-empty-function: "off" */
    /* eslint no-unused-vars: "off" */
    mset( ctx:Context, keyValueObjects:any[] ) {

    }

    //TODO: append, asking, batch, bgrewriteaof, bgsave, bitcount, bit, bitfield,
    // bitop, bitpos, blpop, brpop, brpoplpush, cluster, command, config, connection,
    // cork, create_stream, dbsize, debug, decr, del, discard, drain, dump, duplicate,
    // echo, emit, end, eval, evalsha, exec, exists, expire, expireat, flush_and_error,
    // flushall, flushdb, geoadd, geodist, geohash, geopos, georadius, georadiusbymember,
    // get, getbit, getrange, getset, handle, hdel, hexists, hget, hgetall, hincrby,
    // hincrbyfloat, hkeys, hlen, hmget, hmset, hscan, hset, hsetnx, hstrlen, hvals,
    // incr, incrby, incrbyfloat, info, keys, lastsave, latency, lindex, linsert, listeners,
    // llen, lpop, lpush, lpushx, lrange, lrem, lset, ltrim, memory, mget, migrate, module,
    // monitor, move, mset, msetnx, multi, object, once, persist, pexpire, pexpireat, pfadd,
    // pfcount, pfdebug, pfmerge, pfselftest, ping, post, psetex, psubscribe, psync, pttl, publish
    // pubsub, pubsubscribe, quit, randomkey, readonly, readwrite, ready_check, rename, renamenx,
    // replconf, restore, role, rpop, rpoplpush, rpush, rpushx, sadd, save, scan, scard, script,
    // sdiff, sdiffstore, select, set, setbit, setex, setnx, setrange, shutdown, sinter, sinterstore,
    // sismember, slaveof, slowlog, smembers, smove, sort, spop, srandmember, srem, sscan, strlen,
    // subscribe, substr, sunion, sunionstore, swapdb, sync, time, touch, ttl, type, uncork, unlink,
    // unref, unsubscribe, unwatch, wait, warn, watch, write, zadd, zcard, zcount, zincrby,
    // zinterstore, zlexcount, zrange, zrangeby, zrangebylex, zrank, zrem, zremrangebylex,
    // zremrangebyrank, zremrangebyscore, zrevrange, zrevrangebylex, zrevrangebyscore, zrevrank,
    // zscan, zscore, zunionstore

}

