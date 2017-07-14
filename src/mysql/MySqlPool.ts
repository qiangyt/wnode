import * as Mysql from 'mysql';
import MySqlConnection from './MySqlConnection';
import {SqlBuilder} from '../dao/SqlBuilder';
import {Context} from '../ctx/Context';

declare module global {
    const config:any;
}


export class MySqlPool {

    public $id = 'MySqlPool';
    public $init = "init";
    public $proxy = false;
    public $SqlBuilder:SqlBuilder = null;
    public $lazy = true;
    public pool:Mysql.IPool;

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

    get( ctx:Context ) {
        const me = this;

        return new Promise( function( resolve, reject ) {
            me.pool.getConnection( function( err, conn ) {
                if( err ) reject(err);
                else resolve( new MySqlConnection(me, conn) );
            } );   
        } );
    }

}
