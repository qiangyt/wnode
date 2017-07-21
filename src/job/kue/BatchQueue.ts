import * as Kue from 'kue';
import InternalContext from  '../../ctx/InternalContext';
import Context from  '../../ctx/Context';
import * as Logger from '../../Logger';
import * as Domain from 'domain';
import RedisManager from '../../cache/RedisManager';
import * as Cluster from 'cluster';
import KueApp from './KueApp';


export class BatchItem {

    public job:Kue.Job;
    public done:Function;
}



export default class BatchQueue {
    
    public $id:string;
    public $lazy = true;
    public $init = 'init';
    public queue:Kue.Queue;
    public config:any;
    public logger:any;
    public _batch:BatchItem[];
    

    constructor( id:string ) {
        this.$id = id;

        this.logger = Logger.create(this);
    }


    /* eslint complexity:"off" */
    _config( config:any, name:string ) {
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
        q.inactiveCount( jobName, ( err:any, total:number ) => { 
            if( err ) this.logger.error( {err}, 'failed to call queue.inactiveCount()' );
            else this.logger.info( {inactiveCount: total}, 'queue report' );
        } );
        
        q.activeCount( jobName, ( err:any, total:number ) => { 
            if( err ) this.logger.error( {err}, 'failed to call queue.activeCount()' );
            else this.logger.info( {activeCount: total}, 'queue report' );
        } );

        q.completeCount( jobName, ( err:any, total:number ) => { 
            if( err ) this.logger.error( {err}, 'failed to call queue.completeCount()' );
            else this.logger.info( {completeCount: total}, 'queue report' );
        } );

        q.failedCount( jobName, ( err:any, total:number ) => { 
            if( err ) this.logger.error( {err}, 'failed to call queue.failedCount()' );
            else this.logger.warn( {failedCount: total}, 'queue report' );
        } );

        q.delayedCount( jobName, ( err:any, total:number ) => { 
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

        q.on( 'error', (err:any) => this.logger.error( {err}, 'error on queue' ) );
        
        return q;
    }


    _init( config:any, name:string ) {
        this._config( config, name );

        const q = this.queue = this._createQueue();

        (<any>q).process( config.name, <number>config.batch, ( job:Kue.Job, kueContext:any, done:Function ) => {
            const dmn = Domain.create();
            dmn.on( 'error', (err:any) => {
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
        this.queue.active( (err:any, jobIDs:number[]) => {
            if( err ) {
                this.logger.error( {err, jobIDs}, 'failed to re-queue stuck jobs' );
                return;
            }
            jobIDs.forEach( jobID => {
                Kue.Job.get( jobID, (err:any, job:Kue.Job) => {
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


    _process( job:Kue.Job, done:Function ) {
        
        const batch = this._batch;
        batch.push( {job, done} );

        if( batch.length >= this.config.batch ) {
            this._processBatch();
            return;
        }

        // 还没到批处理的上限
        this.queue.activeCount( this.config.name, ( err:any, total:number ) => { 
            if( err ) this.logger.error( {err}, 'failed to call queue.activeCount()' );
            else if( batch.length > 0 && total < this.config.batch ) {
                this.logger.debug( 'not found more active job, start processing current batch right now' );
                this._processBatch();
            }
        } );
    }


    /* eslint no-unused-vars:'off' */
    _prepareBatch( ctx:Context, batch:BatchItem[] ):Promise<any>[] {
        throw new Error('need to overwrite');
    }


    _processBatch():Promise<any> {
        const batch = this._batch;
        this._batch = [];

        try {
            const ctx = new InternalContext();
            const promises = this._prepareBatch( ctx, batch );

            return Promise.all(promises).catch( (err:any) => {
                batch.forEach( task => task.done(err) );
                this.logger.error( {err}, 'failed to process task' );
            } );
        } catch( err ) {
            batch.forEach( task => task.done(err) );
            this.logger.error( {err}, 'failed to process task' );
            return Promise.resolve();
        }
    }


    _putJob( ctx:Context, jobData:any ) {

        const c = this.config;

        const job:any = this.queue.create( c.name, jobData );
        job.priority(c.priority)
            .attempts(c.attempts)
            .backoff(c.backoff)
            .removeOnComplete(c.removeOnComplete)
            .save( (err:any) => {
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
