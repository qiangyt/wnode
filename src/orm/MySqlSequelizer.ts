import * as _ from 'lodash';
import * as Sequelize from 'sequelize';
import BaseSequelizer from './BaseSequelizer';


export default class MySqlSequelizer extends BaseSequelizer {

    /**
     * 重写BaseSequelizer.createInstance()方法，
     */
    createInstance() {
        let cfg = this.config;
        
        const options = {
            host: cfg.host,
            port: cfg.port,
            dialect: 'mysql',
            pool: {
                maxConnections: (cfg.maxConnections !== undefined) ? cfg.maxConnections : 10,
                minConnections: (cfg.minConnections !== undefined) ? cfg.minConnections : 0,
                maxIdleTime: (cfg.maxIdleTime !== undefined) ? cfg.maxIdleTime : 60000
            },
            timezone: (cfg.timezone !== undefined) ? cfg.timezone : '+08:00',
            benchmark: (cfg.benchmark !== undefined) ? cfg.benchmark : true,
            define: {
                timestamps: false,
                freezeTableName: true
            }
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
