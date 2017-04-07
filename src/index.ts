import * as Path from 'path';
const Path_parse_old = Path.parse;
Path.parse = function(full) {
    const r = Path_parse_old(full);
    r.full = full;
    return r;
}

import Internal from './Internal';
import Config from './Config';
import CodePath from './util/CodePath';
const Bearcat = require('bearcat');
const requireAsBean = Internal.requireAsBean;
import SwaggerHelper from './swagger/SwaggerHelper';
import Schemas from './swagger/Schemas';


function startApp( appJsonPath, startCallback ) {
    // make bearcat global, for `bearcat.module()`
    const bearcat = global.bearcat from 'bearcat');
    bearcat.createApp([CodePath.resolve(appJsonPath)]);

    Internal.initBeans();

    global.bearcat.start(function() {
        global.bearcat.getBean('ApiServer').start(true);

        if( startCallback ) startCallback();
    });
}


function startFunc( starter, configDir, appJsonPath, configCallback, startCallback ) {
    if( !configDir ) configDir = '../config';
    if( !appJsonPath ) appJsonPath = './app.json';

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

function launchMocha(before, done, srcDir, configDir, appJsonPath) {
    if( _mochaLaunched ) {
        if( done ) done();
        return;
    }

    if( !srcDir ) srcDir = '../../../../src';
    if( !configDir ) configDir = '../config';
    if( !appJsonPath ) appJsonPath = './app.json';

    _mochaLaunched = true;

    CodePath.baseDir = Path.join( Path.parse(module.filename).dir, srcDir );

    global.config = new Config( CodePath.resolve(configDir) );

    // make bearcat global, for `bearcat.module()`
    global.bearcat = Bearcat;
    Bearcat.createApp([CodePath.resolve(appJsonPath)]);

    Internal.initBeans();

    if( before ) before();

    Bearcat.start(function() {
        global.bearcat.getBean('ApiServer').start(false);

        if( done ) done();
    });
}


export default {

    requireAsBean:  requireAsBean,

    ApiDefinition:  require('./ApiDefinition'),
    ApiParameter:   require('./ApiParameter'),
    ApiRole:        require('./ApiRole'),
    ApiServer:      requireAsBean(module, './ApiServer'),
    auth:           require('./auth'),

    bean: function bean(beanName) {
        global.bearcat.getBean(beanName);
    },
    blueprint:      require('./blueprint'),
    
    cache:          require('./cache'),
    client:         require('./client'),
    Config:         Config,
    ctx:            require('./ctx'),
    
    dao:            require('./dao'),
    
    Errors:         require('./Errors'),
    ErrorType:      require('./ErrorType'),
    Exception:      require('./Exception'),
    
    graphql:        require('./graphql'),

    HackBearcat:    require('./HackBearcat'),

    job:            require('./job'),
    
    Logger:         require('./Logger'),

    mocha:          launchMocha,

    module:         module,

    mysql:          require('./mysql'),
    
    odm:            require('./odm'),
    orm:            require('./orm'),
    plugin:         require('./plugin'),
    
    schemaFromSequelizer: function buildSchemaFromSequelizer( modelName, instanceName ) {
        return Schemas.buildSchemaFromSequelizer( modelName, instanceName );
    },

    schemaRef: function(name) {
        return SwaggerHelper.schemaRef(name);
    },
    
    search:         require('./search'),
    
    start: function start( configDir, appJsonPath, configCallback, startCallback ) {
        startFunc( startApp, configDir, appJsonPath, configCallback, startCallback );
    },
    
    swagger: require('./swagger'),
    
    test: require('./test'),

    util:           require('./util')

};


