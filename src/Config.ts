import Fs = require('fs');
import Path = require('path');
import _ = require('lodash');

const logger = require('./Logger').create('Config');


export default class Config {

    constructor( dir ) {
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
        const r = require( basePath );
            
        /* eslint no-process-env: "off" */
        const env = process.env.NODE_ENV;

        const jsonEnvPath = Path.join( dir, env + '.json' );
        const jsEnvPath = Path.join( dir, env + '.js' );
        let envPath = jsonEnvPath;

        try {
            /*eslint no-sync: "off"*/
            Fs.statSync(envPath);
        } catch( e ) {
            logger.info( {path: envPath}, 'no env-specific configuration file' );

            envPath = jsEnvPath;
            try {
                Fs.statSync(envPath);
            } catch( err ) {
                logger.info( {path: envPath}, 'no env-specific configuration file' );
                envPath = null;
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
