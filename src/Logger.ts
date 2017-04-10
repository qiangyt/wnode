import * as util from 'util';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as bunyan from 'bunyan';
import Time from './util/Time';
import * as _ from 'lodash';
import BaseContext from './ctx/BaseContext';


const launchTime = new Date();
const logDir = path.join( path.join( process.cwd(), 'logs' ), Time.formatYearMonth(launchTime) );

// 初始化logs目录
/*eslint no-sync: "off"*/
try {
    fs.statSync(logDir);
} catch( e ) {
    mkdirp.sync(logDir);
}


/* eslint no-process-env: "off" */
const env = process.env.NODE_ENV;
const isProd = (env === 'prod');
const isLocal = (env === 'local');


function loadConfiguration() {
    const dir = path.join( process.cwd(), 'config' );

    const basePath = path.join( dir, 'logger.json' );
    console.log( 'base logger config file: ' + basePath );
    const r = require(basePath);

    const envPath = path.join( dir, 'logger.' + env + '.json' );
    console.log( 'env logger config file: ' + envPath );

    let envStat;
    try {
        /*eslint no-sync: "off"*/
        envStat = fs.statSync(envPath);
    } catch( e ) {
        return r;
    }

    if( envStat.isDirectory() ) throw new Error( envPath + ' should be a json file instead a directory' );
    const envData = require(envPath);
    _.merge( r, envData );
    

    if( !r.name ) r.name = 'anode';
    if( !r.level ) r.level = isProd ? 'info' : 'debug';
    if( !r.src ) r.src = !isProd;
    if( !r.rotationPeriod ) r.rotationPeriod = '1d';// daily rotation
    if( !r.rotationCount ) r.rotationCount = 365;   // keep 1 year back copies

    return r;
}

const cfg = loadConfiguration();

const pid = process.pid; // pid is used to append to log file path to survive cluster-ed execution
const logFilePrefix = cfg.name + '_' + Time.formatDate(launchTime) + (isLocal ? '': ('_' + pid));


function contextSerializer(ctx:BaseContext) {
    const r = {
        apiName: ctx.apiDefinition ? ctx.apiDefinition.name : undefined,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        previousRequestId: ctx.previousRequestId,
        txId:<any>(undefined),
        isTxOwner:<boolean>(undefined)
    };

    if( ctx.tx ) {
        r.txId = ctx.tx.id;
        r.isTxOwner = ctx.isTxOwner;
    }

    return r;
}


const rootLoggerOptions = {
    name: cfg.name,
    level: cfg.level,
    src: cfg.src,
    serializers: {
        ctx: contextSerializer,
        err: bunyan.stdSerializers.err,
        req: bunyan.stdSerializers.req,
        res: bunyan.stdSerializers.res
    },
    streams: [
        {
            stream: process.stdout
        },
        {
            type: 'rotating-file',
            period: cfg.rotationPeriod,
            count: cfg.rotationCount,   // keep 1 year back copies
            path: path.join( logDir, logFilePrefix + '.log' ),
            level: cfg.level
        }/*,
        {
            type: 'rotating-file',
            period: '1d',   // daily rotation
            count: 365,   // keep 1 year back copies
            level: 'error',
            path: path.join( logDir, logFilePrefix + '_error.log' )
        }, 
        {
            type: 'rotating-file',
            period: '1d',   // daily rotation
            count: 365,   // keep 1 year back copies
            level: 'fatal',
            path: path.join( logDir, logFilePrefix + '_fatal.log' )
        }*/
    ]
};


const rootLogger = bunyan.createLogger(rootLoggerOptions);


process.on( 'uncaughtException', (err:Error) => {
  rootLogger.fatal(err, 'uncaught exception. exiting...');
  process.exit(1);/* eslint no-process-exit: 'off' */
} );



// In those cases that using external log rotation utilities like logrotate on Linux or logadm on SmartOS/Illumos,
// tell bunyan to reopen the file stream
process.on('SIGUSR2', function () {
    rootLogger.reopenFileStreams();
});



/**
 * 对bunyan日志库的简单封装，以便统一日志设置
 */
export function create(idOrBean:string|any) {
    const id = util.isString(idOrBean) ? idOrBean : idOrBean.$id ;
    return rootLogger.child( {id} );
}

export { cfg as config };