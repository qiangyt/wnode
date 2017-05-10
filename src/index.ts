import * as Path from 'path';
const Path_parse_old = Path.parse;
(<any>Path).parse = function(full:string):Path.ParsedPath {
    const r:any = Path_parse_old(full);
    r.full = full;
    return r;
}

import {registerAsBean, initBeans} from './Internal';
import Config from './Config';
import CodePath from './util/CodePath';
const Bearcat = require('bearcat');
import SwaggerHelper from './swagger/SwaggerHelper';
import Schemas from './swagger/Schemas';

declare module global {
    let config:any;
    let bearcat:any;
}


function startApp( appJsonPath:string, startCallback:Function ) {
    // make bearcat global, for `bearcat.module()`
    const bearcat = global.bearcat = require('bearcat');
    bearcat.createApp([CodePath.resolve(appJsonPath)]);

    initBeans();

    global.bearcat.start(function() {
        global.bearcat.getBean('ApiServer').start(true);

        if( startCallback ) startCallback();
    });
}


function startFunc( starter:Function, configDir = '../config', appJsonPath = './app.json', configCallback?:Function, startCallback?:Function ) {
    module.exports.config = global.config = new Config( CodePath.resolve(configDir) );

    if( configCallback ) {
        configCallback( function() {
           starter( appJsonPath, startCallback );
        } );
    } else {
        starter( appJsonPath, startCallback );
    }
}



let _mochaLaunched = false;

function launchMocha(before:Function, done:Function, srcDir = '../../../src', configDir = '../config', appJsonPath = './app.json') {
    if( _mochaLaunched ) {
        if( done ) done();
        return;
    }

    _mochaLaunched = true;
    
    CodePath.baseDir = Path.join(Path.parse(require.main.filename).dir, srcDir);
    
    global.config = new Config( CodePath.resolve(configDir) );

    // make bearcat global, for `bearcat.module()`
    global.bearcat = Bearcat;
    Bearcat.createApp([CodePath.resolve(appJsonPath)]);

    initBeans();

    if( before ) before();

    Bearcat.start(function() {
        global.bearcat.getBean('ApiServer').start(false);

        if( done ) done();
    });
}


import ApiDefinition from './ApiDefinition';
import ApiParameter from './ApiParameter';
import * as ApiRole from './ApiRole';
import ApiServer from './ApiServer';
import * as auth from './Auth';
import * as blueprint from './blueprint';
import * as cache from './cache';
import * as client from './client';
import * as ctx from './ctx';
import * as dao from './dao';
import * as Errors from './Errors';
import ErrorType from './ErrorType';
import Exception from './Exception';
const HackBearcat = require('./HackBearcat');
import * as job from './job';
import * as Logger from './Logger';
import * as mysql from './mysql';
import * as odm from './odm';
import * as orm from './orm';
import * as search from './search';
import * as swagger from './swagger';
import * as test from './test';
import * as util from './util';


export = {

    registerAsBean,
    ApiDefinition,
    ApiParameter,
    ApiRole,
    ApiServer,
    auth,

    bean: function bean(beanName:string) {
        global.bearcat.getBean(beanName);
    },

    blueprint,
    
    cache,
    client,
    Config,
    ctx,
    
    dao,
    
    Errors,
    ErrorType,
    Exception,

    HackBearcat,

    job,
    
    Logger,

    mocha:          launchMocha,

    module:         module,

    mysql,
    
    odm,
    orm,
    
    schemaFromSequelizer: function buildSchemaFromSequelizer( modelName:string, instanceName:string ) {
        return Schemas.buildSchemaFromSequelizer( modelName, instanceName );
    },

    schemaRef: function(name:string) {
        return SwaggerHelper.schemaRef(name);
    },
    
    search,
    
    start: function start( configDir:string, appJsonPath:string, configCallback:Function, startCallback:Function ) {
        startFunc( startApp, configDir, appJsonPath, configCallback, startCallback );
    },
    
    swagger,
    
    test,

    util

};


registerAsBean(ApiServer);