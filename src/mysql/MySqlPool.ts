import * as Mysql from 'mysql';
import MySqlConnection from './MySqlConnection';
import SqlBuilder from '../dao/SqlBuilder';
import Context from '../ctx/Context';

declare module global {
    const config:any;
    const isProd:boolean;
}


export default class MySqlPool {

    public $id = 'MySqlPool';
    public $init = "init";
    public $proxy = false;
    public $SqlBuilder:SqlBuilder = null;
    public $lazy = true;
    public pool:Mysql.IPool;


    static resolveConfig() {
        let cfg = global.config.database;
        if( !cfg ) throw new Error('<database.password> is not configured');

        if( !cfg.host ) cfg.host = 'mysql';
        if( !cfg.port ) cfg.port = 3306;
        if( !cfg.connectTimeout ) cfg.connectTimeout = 2 * 1000;
        if( !cfg.charset ) cfg.charset = 'UTF8MB4_GENERAL_CI';

        if( undefined === cfg.user ) throw new Error('<database.user> is not configured');
        if( undefined === cfg.password ) throw new Error('<database.password> is not configured');
        if( !cfg.database ) throw new Error('<database.database> is not configured');
        
        let seq = cfg.sequelize;
        if( !seq ) seq = cfg.sequelize = {};
        if( !seq.logging ) seq.logging = global.isProd ? false : true;
        if( !seq.timestamps ) seq.timestamps = true;
        if( !seq.underscored ) seq.underscored = true;
        if( !seq.freezeTableName ) seq.freezeTableName = true;
        if( !seq.engine ) seq.engine = 'InnoDBs';
        if( !seq.dialectOptions ) seq.dialectOptions = {};
        if( !seq.dialectOptions.charset ) {
            if( cfg.charset === 'UTF8MB4_GENERAL_CI' ) seq.dialectOptions.charset = "utf8mb4";
        }

        return cfg;
    }

    /**
     * 
     */
    init() {
        const mysql = MySqlPool.resolveConfig();
        
        const opts = {
            host:           mysql.host,
            port:           mysql.port, 
            user:           mysql.user, 
            password:       mysql.password,
            database:       mysql.database, 
            charset:        mysql.charset,
            connectTimeout: mysql.connectTimeout
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
