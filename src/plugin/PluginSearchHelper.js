'use strict';


const AliSearchHelper = require('../graphql/AliSearchHelper');


class PluginSearchHelper extends AliSearchHelper {

    /** @override */
    _buildStatement_filter( filter ) {
        const r = super._buildStatement_filter(filter);

        r.push( `plugin_id="${this.manifest.id}"` );

        return r;
    }


    /** @override */
    _buildColumns( fields ) {
        const r = super._buildColumns(fields);

        r.plugin_id = this.manifest.id;
        r.id = [r.plugin_id, r.data_id].join(':');

        return r;
    }


    /** @override */
    search( ctx, offset, limit, sortField, sortDirection, filter, word ) {
        return super.search( ctx, offset, limit, sortField, sortDirection, filter, word )
        .then( result => {
            const rowsOfId = result.rows.map( document => document.data_id );
            result.rows = rowsOfId;
            return result;
        } );
    }

}


module.exports = PluginSearchHelper;
