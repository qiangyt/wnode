import MySqlPool from './MySqlPool';
import BaseContext from '../ctx/BaseContext';


export default class MySqlConnection {

    constructor( public pool:MySqlPool, public rawConnection:any ) {
        this.pool = pool;
        this.rawConnection = rawConnection;
    }

    /**
     * 
     */
    query( ctx:BaseContext, sql:string, values ) {
        const me = this;
        
        
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

    insert( ctx:BaseContext, tableName:string, valuesMapByColumns ) {
        const me = this;
        const columns = [];
        const values = [];
        for( let column in valuesMapByColumns ) {
            columns.push( column );
            values.push( valuesMapByColumns[column] );
        }

        const sql = this.pool.$SqlBuilder.insert( tableName, columns );

        return me.query( ctx, sql, values )
        .then( function(result) {
                return result.insertId;
            } 
        );
    }

    update( ctx:BaseContext, tableName:string, valuesMapByColumns, conditionsMapByColumns ) {
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
