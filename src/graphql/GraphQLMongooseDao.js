'use strict';


const MongooseDao = require('../odm/MongooseDao');


class GraphQLMongooseDao extends MongooseDao {


    /*_selectSearchableFields( document ) {
        const searchableFields = this.manifest.searchableFields;

        const r = {};
        let empty = true;

        for( let fieldName in searchableFields ) {
            empty = false;
            r[fieldName] = document[fieldName];
        }

        return empty ? null : r;
    }*/


    _resolveSearchHelper() {
        let r = this.searchHelper;
        if( !r ) {
            this.searchHelper = r = this.engine.componentBuilder().buildSearchHelper(this.manifest);
        }
        return r;
    }


    search( ctx, offset, limit, sortField, sortDirection, filter, word ) {
        const m = this.manifest;
        if( !m.searchable ) throw new Error(`manifest ${m.id} is NOT searchable`);  
        const helper = this._resolveSearchHelper();
        return helper.search( ctx, offset, limit, sortField, sortDirection, filter, word );
    }

    
    _updateWithSearch( ctx, document ) {
        if( !this.manifest.searchable ) return;

        const searchableFields = document;//this._selectSearchableFields(document);
        if( !searchableFields ) return;
        
        this._resolveSearchHelper().update( ctx, searchableFields )
            .catch( err => {
                this.logger.error( {ctx, err}, 'failed to update with search' );
            } );
    }

    
    _removeFromSearch( ctx, document ) {
        if( !this.manifest.searchable ) return;

        const searchableFields = document;//this._selectSearchableFields(document);
        if( !searchableFields ) return;

        this._resolveSearchHelper().delete( ctx, searchableFields )
             .catch( err => {
                this.logger.error( {ctx, err}, 'failed to remove from search' );
            } );
    }


    _addToSearch( ctx, document ) {
        if( !this.manifest.searchable ) return;

        const searchableFields = document;//this._selectSearchableFields(document);
        if( !searchableFields ) return;

        this._resolveSearchHelper().add( ctx, searchableFields )
            .catch( err => {
                this.logger.error( {ctx, err}, 'failed to add to search' );
            } );
    }


    /** @override */
    update( ctx, document ) {
        return super.update( ctx, document )
        .then( result => {
            this._updateWithSearch( ctx, result );
            return result;
        } );
    }

    
    /** @override */
    updateById( ctx, id, document ) {
        return super.updateById( ctx, id, document )
        .then( result => {
            this._updateWithSearch( ctx, result );
            return result;
        } );
    }


    /** @override */
    insert( ctx, document ) {
        return super.insert( ctx, document )
        .then( result => {
            this._addToSearch( ctx, result );
            return result;
        } );
    }

    
    /** @override */
    remove( ctx, document ) {
        return super.remove( ctx, document )
        .then( result => {
            this._removeFromSearch( ctx, result );
            return result;
        } );
    }

    
    /** @override */
    removeById( ctx, id ) {
        return super.removeById( ctx, id )
        .then( result => {
            this._removeFromSearch( ctx, result );
            return result;
        } );
    }

}


module.exports = GraphQLMongooseDao;
