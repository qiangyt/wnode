import BatchQueue = require('./kue/BatchQueue');


export default class AliSearchJobQueue extends BatchQueue {
    

    constructor( id ) {
        super(id);

        this.$AliOpenSearch = null;
    }


    _sortBatch( batch ) {
        const r = {};

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


    _prepareBatch( ctx, batch ) {
        const bundlePerIndexName = this._sortBatch(batch);
        const promises = [];

        for( const indexName in bundlePerIndexName ) {
            const bundle = bundlePerIndexName[indexName];

            const p = this._processBundle( ctx, bundle );
            p.then( () => {
                bundle.dones.forEach( done => done() );
            } )
            .catch( err => {
                bundle.dones.forEach( done => done(err) );
                this.logger.error( {ctx, err}, 'failed to process task' );
            } );

            promises.push(p);
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


    _put( ctx, cmd, data, indexName, tableName ) {

        // check arguments to low risk of invalid data stucked in job queue
        if( !cmd ) throw new Error('blank cmd');
        if( !data ) throw new Error('blank data');
        if( !indexName || indexName === '' ) throw new Error('blank indexName');
        if( !tableName || tableName === '' ) throw new Error('blank tableName');

        const jobData = {cmd, data, indexName, tableName};

        return this._putJob( ctx, jobData );
    }


    put( ctx, cmd, data, indexName, tableName ) {
        return this._put( ctx, cmd, data, indexName, tableName );
    }


    putArray( ctx, cmd, dataList, indexName, tableName ) {
        for( let data of dataList ) {
            this._put( ctx, cmd, data, indexName, tableName );
        }
        return Promise.resolve();
    }

}

