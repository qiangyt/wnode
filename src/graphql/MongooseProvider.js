'use strict';

const MongooseTypeFactory = require('./MongooseTypeFactory');
const Provider = require('./Provider');


class MongooseProvider extends Provider {


    /** @override */
    typeFactory() {
        return new MongooseTypeFactory(this);
    }

    
    /** @override */
    list( ctx, idArray ) {
        return this.dao.list( ctx, idArray );
    }


    _normalizeArg_limit( manifest, limit ) {
        if( !limit || (limit && (limit <= 0 || limit > manifest.maxLimit)) ) {
            limit = manifest.maxLimit;
        }
        return limit;
    }


    _normalizeArg_sorter( manifest, sortField, sortDirection ) {
        let r;
        if( sortField ) {
            const field = manifest.fieldsByName[sortField];
            if( !field ) throw new Error(`field ${sortField} NOT found`);
            if( !field.sortable ) throw new Error(`field ${sortField} NOT sortable`);
            r = {
                [sortField]: (sortDirection === 'DESC') ? 1 : -1
            }
        }
        return r;
    }


    /** @override */
    query( ctx, offset, limit, sortField, sortDirection, filter, word ) {

        const m = this.manifest;
        
        if( word ) {
            if( !m.searchable ) throw new Error(`manifest ${m.id} is NOT searchable`);
            return this.dao.search( ctx, offset, limit, sortField, sortDirection, filter, word );
        }

        limit = this._normalizeArg_limit( m, limit );
        const sorter = this._normalizeArg_sorter( m, sortField, sortDirection );
        const criteria = filter || {};

        return this.dao.queryId( ctx, offset, limit, true, sorter, criteria );
    }


    /** @override */
    mongooseSchema() {
        return this.dao.schema;
    }


    /** @override */
    mongooseSchemaName() {
        return this.dao.schemaName;
    }


    /** @override */
    removeById( ctx, id ) {
        return this.dao.removeById( ctx, id );
    }


    /** @override */
    update( ctx, id, document ) {
        document._id = id;
        return this.dao.update( ctx, document );
    }


    /** @override */
    insert( ctx, document ) {
        return this.dao.insert( ctx, document );
    }

}


module.exports = MongooseProvider;
