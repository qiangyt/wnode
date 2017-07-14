'use strict';


const Util = require('util');
const Logger = require('../Logger');


class AliSearchHelper {


    init() {
        this._normalizeManifest(this.manifest);
        this.logger = Logger.create(`graphql-manifest-${this.manifest.id}-alisearch`);
    }


    /* eslint complexity:"off" */
    _normalizeManifest( manifest ) {
        if( !global.config.aliyun ) throw new Error('config.aliyun is not specified');
        const cfg = global.config.aliyun.search;
        if( !cfg ) throw new Error('config.aliyun.search is not specified');

        let search = manifest.search;
        if( !search ) search = manifest.search = {};

        if( !search.columns ) {
            search.columns = {_id: 'id'};
        }

        if( !search.queryIndex ) {
            search.queryIndex = 'default';
        }
        if( !search.queryColumn ) {
            search.queryColumn = 'search_text';
        }

        let indexName = search.indexName;
        if( !indexName ) {
            /* eslint no-process-env:"off" */
            if( !cfg.indexOfGraphQL ) throw new Error('config.aliyun.search.indexOfGraphQL is not specified');
            indexName = cfg.indexOfGraphQL;
            
            if( !indexName ) {
                throw new Error('cannot determine aliyun open search index name. pls either configure your manifest.search.indexName or config.aliyun.search.indexOfGraphQL');
            }
        }
        search.indexName = indexName;

        if( !search.tableName ) {
            if( cfg.tableOfGraphQL ) {
                search.tableName = cfg.tableOfGraphQL;
            } else {
                search.tableName = 'main';
            }
        }

        if( !search.suggestName ) {
            if( cfg.suggestOfGraphQL ) {
                search.suggestName = cfg.suggestOfGraphQL;
            } else {
                search.suggestName = 'suggest';
            }
        }


        //const jq = this._resolveJobQueue();
        //jq.on( 'add', this._add.bind(this) );
        //jq.on( 'update', this._update.bind(this) );
        //jq.on( 'delete', this._delete.bind(this) );
        //jq.on( this._batch.bind(this) );

    }


    _resolveJobQueue() {
        let r = this._jobQueue;
        if( !r ) {
            r = this._jobQueue = this.engine.componentBuilder().buildJobQueue(this.manifest);
        }
        return r;
    }


    _resolve() {
        let r = this._aliSearch;
        if( !r ) {
            r = this._aliSearch = this.engine.componentBuilder().buildAliOpenSearch();
        }
        return r;
    }


    _buildStatement_config( offset, limit ) {
        return `config=start:${offset}, hit:${limit}`;
    }


    _buildStatement_filter( filter ) {
        const r = [];

        for( let filterName in filter ) {
            let column = this._resolveColumnName(filterName);
            if( !column ) column = filterName;

            let value = filter[filterName];
            if( Util.isString(value) ) value = `"${value}"`;

            r.push( `${column}=${value}` );
        }

        return r;
    }


    _buildStatement_query( searchWord ) {
        return `${this.manifest.search.queryIndex}:'${searchWord}'`;
    }


    _buildStatement_sort( sortField, sortDirection ) {
        let sortColumn;
        if( sortField ) {
            sortColumn = this._resolveColumnName(sortField);
            if( !sortColumn ) {
                sortColumn = this.manifest.search.defaultSortColumn;
            }
        }

        if( sortColumn ) {
            const sortPrefix = (sortDirection === 'ASC') ? '' : '-';
            return sortPrefix + sortColumn;
        }
    
        return null;
    }


    _buildStatement( offset, limit, sortField, sortDirection, filter, word ) {
        const stmts = [];

        const configStmt = this._buildStatement_config( offset, limit );
        if( configStmt ) stmts.push(configStmt);

        const filterStmt = this._buildStatement_filter(filter);
        if( filterStmt.length ) {
            stmts.push('filter=' + filterStmt.join(' AND '));
        }

        const queryStmt = this._buildStatement_query(word);
        stmts.push(`query=${queryStmt}`);

        const sortStmt = this._buildStatement_sort( sortField, sortDirection );
        if( sortStmt ) {
            stmts.push(`sort=${sortStmt};-RANK`);
        }

        return stmts.join(' && ');
    }


    search( ctx, offset, limit, sortField, sortDirection, filter, word ) {
        const stmt = this._buildStatement( offset, limit, sortField, sortDirection, filter, word );

        this.logger.debug( {ctx, stmt}, 'query statement' );

        return this._resolve().search( ctx, this.manifest.search.indexName, stmt )
        .then( searchResult => {
            if( searchResult.status !== 'OK' ) {
                if( searchResult.errors ) {
                    const err = searchResult.errors[0];
                    if( err.code !== 6501 ) { // 6501: no document
                        this.logger.warn({ctx, stmt, offset, limit, sortField, sortDirection, filter, word}, 'failed to search');
                    }
                }
                return {total: 0, offset, limit, rows:[]};
            }

            return {
                total: searchResult.result.total,
                offset,
                limit,
                rows: searchResult.result.items ? searchResult.result.items : []
            };
        } );
    }


    _resolveColumnName( fieldName ) {
        const r = this.manifest.search.columns[fieldName];
        return r || fieldName;
    }


    _buildColumns( fields ) {
        const r = {};

        if( !fields._id ) throw new Error('missing _id');
        r.id = '' + fields._id;
        r.data_id = '' + fields._id;

        const searchableFields = this.manifest.searchableFields;
        const searchTexts = [];

        for( let fieldName in searchableFields ) {
            const value = fields[fieldName];
            searchTexts.push('' + value);
        }

        r[this.manifest.search.queryColumn] = searchTexts.join('\t');

        return r;
    }


    _buildColumnsArray( fieldsArray ) {
        return fieldsArray.map( fields => this._buildColumns(fields) );
    }


    add( ctx, fields ) {
        fields = this._buildColumns(fields);
        const s = this.manifest.search;
        return this._resolveJobQueue().put( ctx, 'add', fields, s.indexName, s.tableName );
    }


    /*_add( ctx, fieldsArray ) {
        const columnsArray = this._buildColumnsArray(fieldsArray);
        const s = this.manifest.search;
        return this._resolve().addByArray( ctx, s.indexName, s.tableName, columnsArray );
    }*/


    addByArray( ctx, fieldsArray ) {
        fieldsArray = this._buildColumnsArray(fieldsArray);
        const s = this.manifest.search;
        return this._resolveJobQueue().putArray( ctx, 'add', fieldsArray, s.indexName, s.tableName );
    }


    update( ctx, fields ) {
        fields = this._buildColumns(fields);
        const s = this.manifest.search;
        return this._resolveJobQueue().put( ctx, 'update', fields, s.indexName, s.tableName );
    }


    updateByArray( ctx, fieldsArray ) {
        fieldsArray = this._buildColumnsArray(fieldsArray);
        const s = this.manifest.search;
        return this._resolveJobQueue().putArray( ctx, 'update', fieldsArray, s.indexName, s.tableName );
    }

    /*
    _update( ctx, fieldsArray ) {
        fieldsArray = this._buildColumnsArray(fieldsArray);
        const s = this.manifest.search;
        return this._resolve().updateByArray( ctx, s.indexName, s.tableName, fieldsArray, s.indexName, s.tableName );
    }*/


    delete( ctx, fields ) {
        fields = this._buildColumns(fields);
        const s = this.manifest.search;
        return this._resolveJobQueue().put( ctx, 'delete', fields, s.indexName, s.tableName );
    }


    /*_delete( ctx, fields ) {
        const columns = this._mapFieldsToColumns(fields);
        const s = this.manifest.search;
        return this._resolve().delete( ctx, s.indexName, s.tableName, columns );
    }*/


    deleteByArray( ctx, fieldsArray ) {
        fieldsArray = this._buildColumnsArray(fieldsArray);
        const s = this.manifest.search;
        return this._resolveJobQueue().putArray( ctx, 'delete', fieldsArray, s.indexName, s.tableName );
    }


    /*_delete( ctx, fieldsArray ) {
        const columnsArray = this._buildColumnsArray(fieldsArray);
        const s = this.manifest.search;
        return this._resolve().deleteByArray( ctx, s.indexName, s.tableName, columnsArray );
    }*/


    suggest( ctx, word, hit ) {
        const s = this.manifest.search;
        return this._resolve().suggest( ctx, s.indexName, word, s.suggestName, hit );
    }

}


module.exports = AliSearchHelper;
