'use strict';

const Errors = require('../Errors');
const Exception = require('../Exception');
const GraphQLEngine = require('./GraphQLEngine');
const ApiRole = require('../ApiRole');
const Logger = require('../Logger');


/**
 *
 */
class BaseAPI {

    constructor( id ) {
        this.$lazy = true;
        this.$init = 'init';
        this.$id = id;
        this.logger = Logger.create(this);
    }


    engine() {
        if( !this._engine ) {
            this.logger.fatal('engine not specified');
            throw new Exception(Errors.INTERNAL_ERROR);
        }
        return this._engine;
    }


    init() {
        const cfg = global.config.graphql;
        
        if( !cfg ) throw new Error('graphql section NOT specified');
        
        if( cfg.engineBean ) {
            if( cfg.engineId ) throw new Error('graphql.engineId is exclusive with graphql.engineBean');

            this.logger.info( {engineBean: cfg.engineBean}, 'engine bean name' );
            this._engine = global.bearcat.getBean(cfg.engineBean);
        } else {
            if( !cfg.engineId ) throw new Error('graphql.engineId NOT specified');

            this.logger.info( {engineId: cfg.engineId}, 'engine id' );
            this._engine = new GraphQLEngine( cfg.engineId, cfg.manifestDir );
            this._engine.init();
        }
    }


    instrumentContext( ctx ) {
        const loaders = ctx.loaders = {};

        ctx.resolveLoader = function( type, methodName ) {
            const key = type.name + '.' + (methodName || 'list');
            let r = [loaders][key];
            if( !r ) {
                r = type._typeConfig.createLoader(ctx);
                loaders[key] = r;
            }
            return r;
        };
    }


    /**
     * 
     */
    exec( ctx, 
        query /* method:'post', type:'string', required:true, description:'GraphQL 查询语句' */, 
        variables /* type:'array', items:{type:'string'}, required:false, description:'GraphQL 查询变量' */, 
        operationName /* type:'string', required:false, description:'GraphQL 查询操作名' */ ) {
    
        this.instrumentContext(ctx);

        return this._exec( this.engine(), ctx, query, variables, operationName );
    }


    /* eslint no-unused-vars:"off" */
    /** @override */
    _exec( engine, ctx, query, variables, operationName ) {
        throw new Error( Errors.GRAPHQL_EXECUTION_FAILURE, 'implementation required' );
    }

}


BaseAPI.role = [ApiRole.any];

module.exports = BaseAPI;
