import * as _ from 'lodash';
import * as Sequelize from 'sequelize';
import BaseSequelizer from './BaseSequelizer';


declare module global {
    const isProd:boolean;
}


export default class MySqlSequelizer extends BaseSequelizer {

    /**
     * 重写BaseSequelizer.createInstance()方法，
     */
    createInstance() {
        let cfg = this.config;
        
        const host = cfg.host = cfg.host || 'mysql';
        const port = cfg.port = cfg.port || 3306;
        const maxConnections = cfg.maxConnections = (cfg.maxConnections !== undefined) ? cfg.maxConnections : (global.isProd ? 1000 : 1);
        const minConnections = cfg.minConnections = (cfg.minConnections !== undefined) ? cfg.minConnections : 0;
        const maxIdleTime = cfg.maxIdleTime = (cfg.maxIdleTime !== undefined) ? cfg.maxIdleTime : 60000;
        const timezone = cfg.timezone = (cfg.timezone !== undefined) ? cfg.timezone : '+08:00';
        const benchmark = cfg.benchmark = (cfg.benchmark !== undefined) ? cfg.benchmark : (global.isProd ? false : true);
        const define = cfg.define = cfg.define || {};
        define.timestamps = define.timestamps = (define.timestamps !== undefined) ? define.timestamps : true;
        define.freezeTableName = define.timestamps = (define.timestamps !== undefined) ? define.freezeTableName : true;
        
        const options:any = {
            host,
            port,
            dialect: 'mysql',
            pool: {
                maxConnections,
                minConnections,
                maxIdleTime
            },
            timezone,
            benchmark,
            define
        };

        _.merge( options, cfg.sequelize );

        if( options.charset === undefined ) options.charset = 'utf8mb4';
        if( options.collate === undefined ) options.collate = 'utf8mb4_unicode_ci';
        if( options.supportBigNumbers === undefined ) options.supportBigNumbers = true;
        if( options.bigNumberStrings === undefined ) options.bigNumberStrings = true;

        this.logger.info( cfg, 'configuration' );
        this.logger.info( options, 'options' );

        return new Sequelize( cfg.database, cfg.user, cfg.password, options );
    }

}
