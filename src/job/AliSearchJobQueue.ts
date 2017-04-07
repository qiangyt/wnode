import BatchQueue from './kue/BatchQueue';
import {BatchItem} from './kue/BatchQueue';
import BaseContext from '../ctx/BaseContext';
import AliOpenSearch from '../search/AliOpenSearch';


export default class AliSearchJobQueue extends BatchQueue {
    
    public $AliOpenSearch:AliOpenSearch = null;

    constructor( id:string ) {
        super(id);
    }


    _sortBatch( batch:BatchItem[] ) {
        const r:any = {};

        batch.forEach( task => {
            const job = task.job;
            const jd = job.data;
            const indexName = jd.indexName;
            if( !indexName ) {
                task.done( new Error() );
                return;
            }

            let bundle = r[indexName];
            if( !bundle ) {
                r[indexName] = bundle = {
                    indexName,
                    tableName: jd.tableName,
                    dones: [],
                    jobs: [],
                    cmdArray: [],
                    fieldsArray: []
                };
            }
            
            bundle.dones.push(task.done);
            bundle.jobs.push(job);
            bundle.cmdArray.push( jd.cmd || 'add' );
            bundle.fieldsArray.push( jd.data );
        } );

        return r;
    }


    _prepareBatch( ctx:BaseContext, batch:BatchItem[] ) {
        const bundlePerIndexName = this._sortBatch(batch);
        const promises = [];

        for( const indexName in bundlePerIndexName ) {
            const bundle = bundlePerIndexName[indexName];

            const p = this._processBundle( ctx, bundle );
            p.then( () => {
                bundle.dones.forEach( (done:Function) => done() );
            } )
            .catch( (err:any) => {
                bundle.dones.forEach( (done:Function) => done(err) );
                this.logger.error( {ctx, err}, 'failed to process task' );
            } );

            promises.push(p);
        }
    }


    _processBundle( ctx:BatchItem, bundle:any ) {
        return this.$AliOpenSearch.batch( ctx, 
                                          bundle.indexName, 
                                          bundle.tableName, 
                                          bundle.cmdArray, 
                                          bundle.fieldsArray )
            .then( () => {
                bundle.dones.forEach( (done:Function) => done() );
            } )
            .catch( (err:any) => {
                bundle.dones.forEach( (done:Function) => done(err) );
                this.logger.error( {ctx, err}, 'failed to process task' );
            } );
    }


    _put( ctx:BaseContext, cmd:string, data:any, indexName:string, tableName:string ) {

        // check arguments to low risk of invalid data stucked in job queue
        if( !cmd ) throw new Error('blank cmd');
        if( !data ) throw new Error('blank data');
        if( !indexName || indexName === '' ) throw new Error('blank indexName');
        if( !tableName || tableName === '' ) throw new Error('blank tableName');

        const jobData = {cmd, data, indexName, tableName};

        return this._putJob( ctx, jobData );
    }


    put( ctx:BaseContext, cmd:string, data:any, indexName:string, tableName:string ) {
        return this._put( ctx, cmd, data, indexName, tableName );
    }


    putArray( ctx:BaseContext, cmd:string, dataList:any[], indexName:string, tableName:string ) {
        for( let data of dataList ) {
            this._put( ctx, cmd, data, indexName, tableName );
        }
        return Promise.resolve();
    }

}

