const Errors = require('../Errors');
import Exception from '../Exception';
import * as Log from '../Logger';
import * as Misc from '../util/Misc';
import Context from './Context';
const logger = Log.create('Transaction');

declare module global {
    const config:any;
    const tx:any;
}


/**
 * 
 */
export default class Transaction {

    public resources:any[] = [];
    public id = Misc.uuid();

    public finishing = false;
    public finished = false;

    public rollbacked = false;
    public rollbacking = false;
    public ignore = false;

    constructor( public ctx:Context, public options:any ) {
        //
    }


    startRollbackTimer() {
        const timeout = this.getTimeout();

        setTimeout( () => {
            if( !(this.finished || this.finishing || this.rollbacked || this.rollbacking ) ) {
                // 如果过了设定的超时时间以后，这个事务还是没被提交或回滚，那么自动回滚
                logger.fatal( this.toLogObject(true), 'rollback due to timeout' );
                this.rollback();
            }
        }, timeout );
    }


    getTimeout() {
        let r = 0;

        if( this.options && this.options.timeout ) r = this.options.timeout;

        if( r <= 0 && global.tx && global.tx.timeout ) r = global.tx.timeout;

        if( !r || r <= 10 ) r = 10; // 10 seconds

        return r * 1000;
    }


    toLogObject( detail:boolean ) {
        return {
            ctx: this.ctx,
            resources: this.resources.map( res => { 
                return {
                    key: res.instance.key,
                    data: detail ? res.data : undefined
                }; 
            } ),
            finished: this.finished,
            finishing: this.finishing,
            rollbacked: this.rollbacked,
            rollbacking: this.rollbacking
        };
    }


    /**
     * 把一个资源排入事务。
     */
    enlist( instance:any ) {

        if( this.finished || this.finishing ) {
            const msg = 'transaction already finished/finishing';
            const logObj = this.toLogObject(false);
            logger.error( logObj, msg );
            throw new Exception( Errors.INTERNAL_ERROR, msg, logObj );
        }
        
        if( !instance ) throw new Exception( Errors.INTERNAL_ERROR, 'instance should be NOT undefined/null' );
        
        const key = instance.key;
        if( !key ) throw new Exception( Errors.INTERNAL_ERROR, 'instance should be NOT undefined/null' );

        const instanceLog = {key, ctx: this.ctx};
        logger.debug( instanceLog, 'enlisting' );

        const resources = this.resources;

        if( resources.length > 0 ) {
            const existing = resources[0];
            if( existing.instance.key === key ) {
                // 重复，但是可以容忍
                logger.debug( instanceLog, 'enlistment ignored due to duplicated instance key' );
                return Promise.resolve(existing.data);
            }

            // 没有重复，但是目前还只支持但事务源（TODO: 后续考虑支持多个事务资源，2PC分布式事务），
            // 所以实际上this.resources.length <= 1
            const msg = 'some instance already enlisted before';
            const logObj = {ctx: this.ctx, key: existing.instance.key, description: existing.description};
            logger.error( logObj, msg );
            throw new Exception( Errors.INTERNAL_ERROR, msg, logObj );
        }

        return instance.enlistTx(this.options)
        .then( (data:any) => {
            if( !data ) throw new Exception( Errors.INTERNAL_ERROR, 'enlisted data should be NOT undefined/null' );
            
            resources.push({instance, data});
            logger.debug( instanceLog, 'enlisted' );

            this.ignore = false;

            return data;
        } );
    }


    _setFinishing( logObj:any, finishing:boolean ) {
        this.finishing = finishing;
        logObj.finishing = this.finishing;

        this.finished = !finishing;
        logObj.finished = this.finished;
    }


    _setRollbacking( logObj:any, rollbacking:boolean ) {
        this.rollbacking = rollbacking;
        logObj.rollbacking = this.rollbacking;

        this.rollbacked = !rollbacking;
        logObj.rollbacked = this.rollbacked;
    }


    commit() {
        const logObj = this.toLogObject(false);
        logger.debug( logObj, 'committing' );

        if( this.finished || this.finishing ) {
            const msg = 'transaction already finished/finishing';
            logger.error( logObj, msg );
            throw new Exception( Errors.INTERNAL_ERROR, msg, logObj );
        }

        this._setFinishing( logObj, true );

        if( this.resources.length === 0 ) {
            this._setFinishing( logObj, false );

            logger.debug( logObj, 'nothing to commit' );
            return Promise.resolve();
        }

        const res = this.resources[0];
        this.resources = [];
        
        logger.debug( logObj, 'commit prepared' );

        return res.instance.commitTx(res.data)
        .then( () => {
            this._setFinishing( logObj, false );

            logger.debug( logObj, 'commit-ed' );
         } )
        .catch( (err:any) => {
            this._setFinishing( logObj, false );
            
            const msg = 'commit failed';
            Object.assign( err, this.toLogObject(true) );
            logger.fatal( err, msg );
            throw new Exception( Errors.INTERNAL_ERROR, msg, err );
        } );
    }


    rollback() {
        
        const logObj = this.toLogObject(false);
        logger.debug( logObj, 'rollbacking' );

        if( this.finished || this.finishing ) {
            if( this.rollbacked || this.rollbacking ) return Promise.resolve();
            
            const msg = 'transaction already finished/finishing';
            logger.error( logObj, msg );
            throw new Exception( Errors.INTERNAL_ERROR, msg, logObj );
        }

        this._setFinishing( logObj, true );
        this._setRollbacking( logObj, true );

        if( this.resources.length === 0 ) {
            this._setFinishing( logObj, false );
            this._setRollbacking( logObj, false );

            logger.debug( logObj, 'nothing to rollback' );
            return Promise.resolve();
        }


        const res = this.resources[0];
        this.resources = [];
        
        logger.debug( logObj, 'rollback prepared' );

        return res.instance.rollbackTx(res.data)
        .then( () => {
            this._setFinishing( logObj, false );
            this._setRollbacking( logObj, false );

            logger.info( logObj, 'rollbacked' );
         } )
        .catch( (err:any) => {
            this._setFinishing( logObj, false );
            this._setRollbacking( logObj, false );

            // 标记rollback并未成功
            this.rollbacked = false; 
            logObj.rollbacked = this.rollbacked;

            const msg = 'rollback failed';
            Object.assign( err, this.toLogObject(true) );
            logger.fatal( err, msg );
        } );
    }

}

exports.Transaction = Transaction;
