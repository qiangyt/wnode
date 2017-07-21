import MySqlPool from './MySqlPool';
import Context from '../ctx/Context';


export default class MySqlConnection {

    constructor( public pool:MySqlPool, public rawConnection:any ) {
        this.pool = pool;
        this.rawConnection = rawConnection;
    }

    /**
     * 
     */
    query( ctx:Context, sql:string, values:any[] ) {
        const me = this;
        
        
        return new Promise( function( resolve, reject ) {
            me.rawConnection.query( sql, values, function(err:any, result:any) {
                if( err ) {
                    me.release();
                    reject(err);
                } else {
                    resolve(result);
                }
            } );
        } );
    }

    insert( ctx:Context, tableName:string, valuesMapByColumns:any ) {
        const me = this;
        const columns = [];
        const values = [];
        for( let column in valuesMapByColumns ) {
            columns.push( column );
            values.push( valuesMapByColumns[column] );
        }

        const sql = this.pool.$SqlBuilder.insert( tableName, columns );

        return me.query( ctx, sql, values )
        .then( function(result:any) {
                return result.insertId;
            } 
        );
    }

    update( ctx:Context, tableName:string, valuesMapByColumns:any, conditionsMapByColumns:any ) {
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
        .then( function(result:any) {
                return result.affectedRows;
            } 
        );
    }

    release() {
        this.rawConnection.release();
    }

}
