import * as Fs from 'fs';
import * as Path from 'path';
import * as _ from 'lodash';

const logger = require('./Logger').create('Config');


export default class Config {

    constructor( dir:string ) {
        const jsonBasePath = Path.join( dir, 'config.json' );
        const jsBasePath = Path.join( dir, 'config.js' );
        let basePath = jsonBasePath;

        try {
            Fs.statSync(basePath);
        } catch( e ) {
            logger.info( {path: basePath}, 'no json configuration file' );

            basePath = jsBasePath;
            try {
                Fs.statSync(basePath);
            } catch( err ) {
                logger.fatal( {err, path:basePath}, 'failed to find js configuration file' );
                throw new Error( `either ${jsonBasePath} or ${jsBasePath} should exist for configuration` );
            }
        }

        logger.info( {path: basePath}, 'base config file' );
        const r = require(basePath);
            
        /* eslint no-process-env: "off" */
        const env = process.env.NODE_ENV;

        const jsonEnvPath = Path.join( dir, env + '.json' );
        const jsEnvPath = Path.join( dir, env + '.js' );
        let envPath;

        try {
            /*eslint no-sync: "off"*/
            Fs.statSync(jsonEnvPath);
            envPath = jsonEnvPath;
        } catch( e ) {
            logger.info( {path: jsonEnvPath}, 'no env-specific configuration file' );

            try {
                Fs.statSync(jsEnvPath);
                envPath = jsEnvPath;
            } catch( err ) {
                logger.info( {path: jsEnvPath}, 'no env-specific configuration file' );
            }
        }

        logger.info( {path: envPath}, 'env config file' );

        if( envPath ) {
            const envData = require(envPath);
            _.merge( r, envData );
        }

        r.isLocal = ('local' === env);
        r.isDev = ('dev' === env);
        r.isTest = ('test' === env);
        r.isUat = ('uat' === env);
        r.isProd = ('prod' === env);
        
        return r;
    }

}
