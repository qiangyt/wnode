import Kue = require('kue');
import InternalContext = require( '../../ctx/InternalContext' );
import Logger = require('../../Logger');
import Domain = require('domain');
import RedisManager = require('../../cache/RedisManager');
import Cluster = require('cluster');
import KueApp = require('./KueApp');


export default class BatchQueue {
    

    constructor( id ) {
        this.$id = id;
        this.$lazy = true;
        this.$init = 'init';

        this.logger = Logger.create(this);
    }


    /* eslint complexity:"off" */
    _config( config, name ) {
        config.priority = config.priority || 'normal';
        config.attempts = config.attempts || 1;
        config.backoff = config.backoff || {delay: (60 * 1000), type:'fixed'};
        config.ttl = config.ttl || (60 * 1000);
        config.name = name || this.$id;
        config.batch = config.batch || 100;
        config.watchStuckJobsInterval = config.watchStuckJobsInterval || (60 * 1000);
        config.removeOnComplete = config.removeOnComplete || true;
        config.redisPrefix = config.name;
        config.reportInterval = config.reportInterval || (60 * 1000);
    }


    _reportQueueStatus() {
        const q = this.queue;
        const jobName = this.config.name;

        //// others are activeCount, completeCount, failedCount, delayedCount
        q.inactiveCount( jobName, ( err, total ) => { 
            if( err ) this.logger.error( {err}, 'failed to call queue.inactiveCount()' );
            else this.logger.info( {inactiveCount: total}, 'queue report' );
        } );
        
        q.activeCount( jobName, ( err, total ) => { 
            if( err ) this.logger.error( {err}, 'failed to call queue.activeCount()' );
            else this.logger.info( {activeCount: total}, 'queue report' );
        } );

        q.completeCount( jobName, ( err, total ) => { 
            if( err ) this.logger.error( {err}, 'failed to call queue.completeCount()' );
            else this.logger.info( {completeCount: total}, 'queue report' );
        } );

        q.failedCount( jobName, ( err, total ) => { 
            if( err ) this.logger.error( {err}, 'failed to call queue.failedCount()' );
            else this.logger.warn( {failedCount: total}, 'queue report' );
        } );

        q.delayedCount( jobName, ( err, total ) => { 
            if( err ) this.logger.error( {err}, 'failed to call queue.delayedCount()' );
            else this.logger.info( {delayedCount: total}, 'queue report' );
        } );
    }


    _createQueue() {
        this._batch = [];

        const redisInstance = RedisManager.instance.get(this.config.redisInstance);
        const q = Kue.createQueue({
            prefix: this.config.redisPrefix,
            redis: redisInstance.config
        });

        q.on( 'error', err => this.logger.error( {err}, 'error on queue' ) );
        
        return q;
    }


    _init( config, name ) {
        this._config( config, name );

        const q = this.queue = this._createQueue();

        q.process( config.name, config.batch, ( job, kueContext, done ) => {
            const dmn = Domain.create();
            dmn.on( 'error', err => {
                done(err);
                this.logger.error( {err, job}, 'failed to process' );
            } );
            dmn.run( () => this._process( job, done ) );
        } );

        this._startReportQueueStatus();        

        this._requeueStuckJobs();

        KueApp.instance.initOnce();
    }


    _startReportQueueStatus() {
        if( !Cluster.isMaster ) return;

        this._reportQueueStatus();
        setInterval( () => this._reportQueueStatus(), this.config.reportInterval );
    }


    _requeueStuckJobs() {
        this.queue.watchStuckJobs(this.config.watchStuckJobsInterval);

        // re-queue all stuck jobs:
        this.queue.active( (err, jobIDs) => {
            if( err ) {
                this.logger.error( {err, jobIDs}, 'failed to re-queue stuck jobs' );
                return;
            }
            jobIDs.forEach( jobID => {
                Kue.Job.get( jobID, (err, job) => {
                    if( err ) {
                        this.logger.error( {err, jobID}, 'failed to get stuck job to re-queue' );
                        return;
                    }
                    // Your application should check if job is a stuck one
                    job.inactive();
                } );
            } );
        });
    }


    _process( job, done ) {
        
        const batch = this._batch;
        batch.push( {job, done} );

        if( batch.length >= this.config.batch ) {
            this._processBatch();
            return;
        }

        // 还没到批处理的上限
        this.queue.activeCount( this.config.name, ( err, total ) => { 
            if( err ) this.logger.error( {err}, 'failed to call queue.activeCount()' );
            else if( batch.length > 0 && total < this.config.batch ) {
                this.logger.debug( 'not found more active job, start processing current batch right now' );
                this._processBatch();
            }
        } );
    }


    /* eslint no-unused-vars:'off' */
    _prepareBatch( ctx, batch ) {
        throw new Error('need to overwrite');
    }


    _processBatch() {
        const batch = this._batch;
        this._batch = [];

        try {
            const ctx = new InternalContext();
            const promises = this._prepareBatch( ctx, batch );

            return Promise.all(promises).catch( err => {
                batch.forEach( task => task.done(err) );
                this.logger.error( {err}, 'failed to process task' );
            } );
        } catch( err ) {
            batch.forEach( task => task.done(err) );
            this.logger.error( {err}, 'failed to process task' );
        }
    }


    _processBundle( ctx, bundle ) {
        return this.$AliOpenSearch.batch( ctx, 
                                          bundle.indexName, 
                                          bundle.tableName, 
                                          bundle.cmdArray, 
                                          bundle.fieldsArray )
            .then( () => {
                bundle.dones.forEach( done => done() );
            } )
            .catch( err => {
                bundle.dones.forEach( done => done(err) );
                this.logger.error( {ctx, err}, 'failed to process task' );
            } );
    }


    _putJob( ctx, jobData ) {

        const c = this.config;

        const job = this.queue.create( c.name, jobData );
        job.priority(c.priority)
            .attempts(c.attempts)
            .backoff(c.backoff)
            .removeOnComplete(c.removeOnComplete)
            .save( err => {
                const logObj = {ctx, jobData, job};
                this.logger.debug( logObj, 'enque-ed job' );
                if( !err ) {
                    this.logger.debug( logObj, 'saved job' );
                } else {
                    this.logger.warn( logObj, 'failed to save job' );
                }
            } );

        return Promise.resolve();
    }

}
