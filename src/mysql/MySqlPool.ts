import Mysql = require('mysql');
import MySqlConnection = require('./MySqlConnection');


export default class MySqlPool {

    constructor() {
        this.$id = 'MySqlPool';
        this.$init = "init";
        this.$proxy = false;
        this.$SqlBuilder = null;
        this.$lazy = true;
    }

    /**
     * 
     */
    init() {
        const mysql = global.config.database;

        if( !mysql.user ) throw new Error('<database.user> is not configured');
        if( undefined === mysql.password ) throw new Error('<database.password> is not configured');
        if( !mysql.database ) throw new Error('<database.database> is not configured');
        
        const opts = {
            host:           mysql.host ? mysql.host : 'localhost',
            port:           mysql.port ? mysql.port : 3306, 
            user:           mysql.user, 
            password:       mysql.password,
            database:       mysql.database, 
            charset:        mysql.charset ? mysql.charset : 'UTF8_GENERAL_CI',
            connectTimeout: mysql.connectTimeout ? mysql.connectTimeout : (10 * 1000)
        };
        this.pool = Mysql.createPool( opts );
    }

    get( ctx, callback ) {
        const me = this;
        if( callback ) {
            me.pool.getConnection( function( err, conn ) {
                if( err ) {
                    return ctx.error(err);
                }
                return ctx.callback( callback, new MySqlConnection(me, conn) );
            } );
            return undefined;
        }

        return new Promise( function( resolve, reject ) {
            me.pool.getConnection( function( err, conn ) {
                if( err ) reject(err);
                else resolve( new MySqlConnection(me, conn) );
            } );   
        } );
    }

}
