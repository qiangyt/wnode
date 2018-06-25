
import * as Internal from './Internal';

const Path = require('path');
const Log = require('./Logger');

const logger = Log.create('wnode');

declare module global {
    let bearcat:any;
    let config:any;
    let pkg:any;
}

const Path_parse_old = Path.parse;
Path.parse = function(full:string) {
    const r = Path_parse_old(full);
    r.full = full;
    return r;
}

import Config from './Config';
import CodePath from './util/CodePath';
const Bearcat = require('bearcat');
const requireAsBean = Internal.requireAsBean;
//import registerAsBean = Internal.registerAsBean;
import SwaggerHelper from './swagger/SwaggerHelper';
import Schemas from './swagger/Schemas';


function startApp(appJsonPath:string, startCallback:Function) {
    // make bearcat global, for `bearcat.module()`
    const bearcat = global.bearcat = require('bearcat');
    bearcat.createApp([CodePath.resolve(appJsonPath)]);

    Internal.initBeans();

    global.bearcat.start(function() {
        global.bearcat.getBean('ApiServer').start(true);

        if (startCallback) startCallback();

        logger.info('global configuration after starting...\n\n' + global.config.dump());
    });
}


function startFunc(appName:string, starter:Function, configDir = '../config', appJsonPath = './app.json', configCallback?:Function, startCallback?:Function) {

    appName = appName || global.pkg.name;
    
    module.exports.config = global.config = new Config(appName, CodePath.resolve(configDir));
    logger.info('global configuration before starting...\n\n' + global.config.dump());
    
    if (configCallback) {
        configCallback(function() {
            starter(appJsonPath, startCallback);
        });
    } else {
        starter(appJsonPath, startCallback);
    }
}



let _mochaLaunched = false;

export function mocha(appName:string, before?:Function, done?:Function, srcDir = '../../../src', configDir = '../config', appJsonPath = './app.json') {
    if (_mochaLaunched) {
        if (done) done();
        return;
    }

    _mochaLaunched = true;

    appName = appName || global.pkg.name;

    CodePath.baseDir = Path.join(Path.parse(require.main.filename).dir, srcDir);

    global.config = new Config(appName, CodePath.resolve(configDir));
    logger.info('global configuration before starting...\n\n' + global.config.dump());

    // make bearcat global, for `bearcat.module()`
    global.bearcat = Bearcat;
    Bearcat.createApp([CodePath.resolve(appJsonPath)]);

    Internal.initBeans();

    if (before) before();

    Bearcat.start(function() {
        global.bearcat.getBean('ApiServer').start(false);

        if (done) done();
    });
}

export function bean(beanName:string) {
    global.bearcat.getBean(beanName);
}

export function schemaFromSequelizer(modelName:string, instanceName:string) {
    return Schemas.buildSchemaFromSequelizer(modelName, instanceName);
}

export function schemaRef(name:string) {
    return SwaggerHelper.schemaRef(name);
}

export function start(appName:string, configDir:string, appJsonPath:string, configCallback?:Function, startCallback?:Function) {
    startFunc(appName, startApp, configDir, appJsonPath, configCallback, startCallback);
}

module.exports = {
    requireAsBean,

    ApiDefinition: require('./ApiDefinition').default,
    ApiParameter: require('./ApiParameter').default,
    ApiRole: require('./ApiRole'),
    ApiServer: requireAsBean(module, './ApiServer'),
    api: require('./api'),
    auth: require('./auth'),

    bean: bean,
    blueprint: require('./blueprint'),

    cache: require('./cache'),
    client: require('./client'),
    Config,
    ctx: require('./ctx'),

    dao: require('./dao'),

    Errors: require('./Errors'),
    ErrorType: require('./ErrorType').default,
    Exception: require('./Exception').default,

    file: require('./file'),

    //graphql: require('./graphql'),

    HackBearcat: require('./HackBearcat'),

    job: require('./job'),

    Logger: Log,

    mocha: mocha,
    module: module,

    mysql: require('./mysql'),

    odm: require('./odm'),
    orm: require('./orm'),

    //plugin: require('./plugin'),

    schemaFromSequelizer: schemaFromSequelizer,
    schemaRef: schemaRef,
    search: require('./search'),
    start: start,
    swagger: require('./swagger'),

    test: require('./test'),

    util: require('./util')

};


//registerAsBean(ApiServer);

