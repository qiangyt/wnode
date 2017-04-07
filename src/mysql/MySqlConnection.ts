

export default class MySqlConnection {

    constructor( pool, rawConnection ) {
        this.pool = pool;
        this.rawConnection = rawConnection;
    }

    /**
     * 
     */
    query( ctx, sql, values, callback ) {
        const me = this;
        if( callback ) {
            me.rawConnection.query( sql, values, function(err, result) {
                if( err ) {
                    me.release();
                    return ctx.error(err);
                } 
                return ctx.callback(callback, result);
            } );
            return undefined; 
        }
        
        return new Promise( function( resolve, reject ) {
            me.rawConnection.query( sql, values, function(err, result) {
                if( err ) {
                    me.release();
                    reject(err);
                } else {
                    resolve(result);
                }
            } );
        } );
    }

    insert( ctx, tableName, valuesMapByColumns, callback ) {
        const me = this;
        const columns = [];
        const values = [];
        for( let column in valuesMapByColumns ) {
            columns.push( column );
            values.push( valuesMapByColumns[column] );
        }

        const sql = this.pool.$SqlBuilder.insert( tableName, columns );

        if( callback ) {
            me.query( ctx, sql, values, function(result) {
                ctx.callback(callback, result.insertId );
            } );
            return undefined;
        }

        return me.query( ctx, sql, values )
        .then( function(result) {
                return result.insertId;
            } 
        );
    }

    update( ctx, tableName, valuesMapByColumns, conditionsMapByColumns, callback ) {
        const me = this;
        const values = [];

        const valueColumns = [];
        for( let column in valuesMapByColumns ) {
            valueColumns.push( column );
            values.push( valuesMapByColumns[column] );
        }

        const conditionColumns = [];
        for( let column in conditionsMapByColumns ) {
            conditionColumns.push( column );
            values.push( conditionsMapByColumns[column] );
        }

        const sql = me.pool.$SqlBuilder.update( tableName, conditionColumns, valueColumns );

        if( callback ) {
            me.query( ctx, sql, values, function(result) {
                ctx.callback(callback, result.affectedRows );
            } );
            return undefined;
        }

        return me.query( ctx, sql, values )
        .then( function(result) {
                return result.affectedRows;
            } 
        );
    }

    release() {
        this.rawConnection.release();
    }

}
