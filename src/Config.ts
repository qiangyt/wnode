/* eslint no-process-env:'off' */

import * as Fs from 'fs';
import * as Path from 'path';
import * as Os from 'os';
import * as _ from 'lodash';
import * as Log from './Logger';
const Mkdirp = require('mkdirp');

const ENV = process.env.NODE_ENV;

declare module global {
    let isLinux:boolean;
    let isMac:boolean;

    let workFolder:string;

    let isLocal:boolean;
    let isDev:boolean;
    let isTest:boolean;
    let isUat:boolean;
    let isProd:boolean;
}


export default class Config {

    public logger:Log.Logger;
    public object:any;
    public envPath:string;

    constructor( public name:string, public dir:string ) {
        this.logger = Log.create(name);

        let workFolderBase;
        if (global.isLinux || global.isMac) workFolderBase = '/data';
        else workFolderBase = Os.tmpdir();

        global.workFolder = Path.join(workFolderBase, name, ENV, 'server', 'work');
        Mkdirp.sync(global.workFolder);

        const jsonBasePath = Path.join( dir, 'config.json' );
        const jsBasePath = Path.join( dir, 'config.js' );
        let basePath = jsonBasePath;

        try {
            Fs.statSync(basePath);
        } catch( e ) {
            this.logger.info( {path: basePath}, 'no json configuration file' );

            basePath = jsBasePath;
            try {
                Fs.statSync(basePath);
            } catch( err ) {
                this.logger.fatal( {err, path:basePath}, 'failed to find js configuration file' );
                throw new Error( `either ${jsonBasePath} or ${jsBasePath} should exist for configuration` );
            }
        }

        this.logger.info( {path: basePath}, 'base config file' );
        const r = this.object = require(basePath);
            
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
            this.logger.debug( {path: jsonEnvPath}, 'no env-specific configuration file' );

            try {
                Fs.statSync(jsEnvPath);
                envPath = jsEnvPath;
            } catch( err ) {
                this.logger.debug( {path: jsEnvPath}, 'no env-specific configuration file' );
            }
        }

        this.logger.info( {path: envPath}, 'env config file' );

        if( envPath ) {
            const envData = require(envPath);
            _.merge( r, envData );
        }
        this.envPath = envPath;

        global.isLocal = r.isLocal = ('local' === env);
        global.isDev = r.isDev = ('dev' === env);
        global.isTest = r.isTest = ('test' === env);
        global.isUat = r.isUat = ('uat' === env);
        global.isProd = r.isProd = ('prod' === env);
        
        const toLog = {
            isLinux: global.isLinux,
            isMac:global.isMac,

            workFolder:global.workFolder,

            isLocal:global.isLocal,
            isDev:global.isDev,
            isTest:global.isTest,
            isUat:global.isUat,
            isProd:global.isProd
        }
        this.logger.info(toLog, 'global configuration');
        
        r.dump = this.dump.bind(this);
    
        return r;
    }


    dump(msg:string) {
        this.logger.info({name: this.name, object: this.object, dir:this.dir, envPath:this.envPath}, msg);
    }

}
