import _ = require('lodash');
import SequelizerManager = require('./SequelizerManager');
import Errors = require('../Errors');
import Exception = require('../Exception');
import Logger = require('../Logger');
import SequelizerTx = require('./SequelizerTx');
import Promise = require('bluebird');// 因为sequelizer使用bluebird的Promise，所以我们这里也必须使用bluebird


export default class SequelizeDao {

    constructor( modelName, instanceName ) {
        if( !modelName ) throw new Error('model name not specified');
        this.modelName = modelName;

        this.instanceName = instanceName;

        this.$init = 'init';
        this.logger = Logger.create('Sequelizer.' + (instanceName ? instanceName : '<default>') + '.' + modelName);
    }

    /**
     * 初始化
     */
    init() {
        const s = this.sequelizer = SequelizerManager.instance.get(this.instanceName).instance;
        const m = this.model = s.models[this.modelName];
        if( !m ) throw new Error('model ' + this.modelName + ' not found');
    }

    /**
     * 取得主键字段
     */
    idFields() {
        return this.model.primaryKeyAttributes;
    }

    /** 绑定事务，如果当前存在事务(在ctx.tx中保存)的话。如果ctx.ignoreTx，那么忽略事务 */
    _withTx( ctx, options ) {
        const tx = ctx.tx;
        if( tx && !tx.ignore ) {
            // TODO: 事务开启时，同一个连接上所有操作必须串行执行，即不允许并发操作，因此，
            // 我们有必要检查并确保这种串行性。
            return tx.enlist( new SequelizerTx(this.sequelizer) )
            .then( txData => {
                if( !options ) options = {};
                options.transaction = txData;
                return options;
            } );
        }
        return Promise.resolve(options);
    }


    /** 构造一个带where条件的options */
    _where( options ) {
        if( !options ) options = {};
        if( !options.where ) options.where = {};
        return options;
    }

    /** 用id获取entity，返回Promise<entity> */
    get( ctx, id, options ) {
        return this._withTx( ctx, options )
        .then( options => this.model.findById( id, options ) );
    }

    /** 用id获取entity，返回Promise<entity>。如果找不到entity，则报错 */
    load( ctx, id, options ) {
        return this.get( ctx, id, options ).then( entity => {
            if( !entity ) throw new Exception( Errors.ENTITY_NOT_FOUND, this.modelName, id );
            return entity;
        } );
    }

    /** 用id数组获取对应的数据对象，返回Promise<entity[]> */
    list( ctx, idArray, options ) {
        options = this._where(options );
        const idField = this.idFields()[0];
        options.where[idField] = {$in: idArray};//TODO: 尚不支持composite primary key
        return this.findAll( ctx, options );
    }

    /** 用id数组获取对应的数据对象，保持和idArray里一样的顺序，返回Promise<entity[]> */
    orderedList( ctx, idArray, options ) {
        return this.map( ctx, idArray, options )
        .then( mapById => idArray.map( id => mapById[id] ) );
    }

    /** 用id数组获取对应的数据对象，返回Promise<{id->entity}> */
    map( ctx, idArray, options ) {
        return this.list( ctx, idArray, options )
        .then( entityArray => {
            const r = {};
            const idField = this.idFields()[0];
            entityArray.forEach( function(entity) {
                const id = entity.get(idField);
                r[id] = entity;
            } );
            return r;
        } );
    }

    /** 任意查询，返回多行结果，返回Promise<entity[]> */
    findAll( ctx, options ) {
        return this._withTx( ctx, options )
        .then( options => this.model.findAll(options) );
    }

    /** 同findAll */
    find( ctx, options ) {
        return this.findAll( ctx, options );
    }

    /** 任意查询，返回1行结果，返回Promise<entity> */
    findOne( ctx, options ) {
        return this._withTx( ctx, options )
        .then( options => {
            return this.model.findOne(options);
         } );
    }

    /** 查询表中是否至少有一行，返回Promise<boolean> */
    hasOne( ctx ) {
        return this.findOne(ctx).then(entity => (undefined !== entity && null !== entity));
    }

    /** 分页查询，返回Promise<entity[] */
    page( ctx, options, offset, limit ) {
        if( !options ) options = {};
        _.merge( options, {limit, offset} );
        return this.findAll( ctx, options );
    }

    /** 分页查询并返回总行数，返回Promise<{rows:entity[], count:integer}> */
    pageAndCount( ctx, options, offset, limit ) {
        if( !options ) options = {};
        _.merge( options, {limit, offset} );

        return this._withTx( ctx, options )
        .then( options => this.model.findAndCountAll(options) );
    }

    /** 判断指定entity是否存在，返回Promise<boolean> */
    exists( ctx, id, options ) {
        options = this._where(options);
        const idField = this.idFields()[0];
        options.where[idField] = id;//TODO: 尚不支持composite primary key
        return this.count( ctx, options ).then( amount => amount > 0 );
    }

    /** 计数，返回Promise<integer> */
    count( ctx, options ) {
        return this._withTx( ctx, options )
        .then( options => this.model.count(options) );
    }

    /** 创建一个entity，返回Promise<entity> */
    insert( ctx, values, options ) {
        return this._withTx( ctx, options )
        .then( options => this.model.create( values, options ) );
    }
    
    /** 更新一个entity，返回Promise<entity> */
    update( ctx, entity, values, options ) {
        if( !options ) options = {};
        _.merge( options, {fields: _.keys(values)} );

        return this._withTx( ctx, options )
        .then( options => entity.update( values, options ) );
    }

    /** 用id取得一个entity，然后更新这个entity，返回Promise<entity> */
    updateById( ctx, id, values, options ) {
        return this.load( ctx, id, options )
            .then( entity => this.update( ctx, entity, values, options ) );
    }
    
    /** 创建或更新一个entity */
    upsert( ctx, values, options ) {
        return this._withTx( ctx, options )
        .then( options => this.model.upsert( values, options ) );
    }

    /** 递增一组field，返回Promise<entity> */
    inc( ctx, entity, fields, options ) {
        return this._withTx( ctx, options )
        .then( options => entity.increment( fields, options ) );
    }

    /** 用id取得一个entity，然后递增这个entity的一组field，返回Promise<entity> */
    incById( ctx, id, fields, options ) {
        return this.load( ctx, id, options )
            .then( entity => this.inc( ctx, entity, fields, options ) );
    }

    /** 递减一组field，返回Promise<entity> */
    dec( ctx, entity, fields, options ) {
        return this._withTx( ctx, options )
        .then( options => entity.decrement( fields, options ) );
    }

    /** 用id取得一个entity，然后递减这个entity的一组field，返回Promise<entity> */
    decById( ctx, id, fields, options ) {
        return this.load( ctx, id, options )
            .then( entity => this.dec( ctx, entity, fields, options ) );
    }

    remove( ctx, entity, options ) {
        return this._withTx( ctx, options )
        .then( options => entity.destroy(options) );
    }

    removeById( ctx, id, options ) {
        return this.load( ctx, id, options )
            .then( entity => this.remove( ctx, entity, options ) );
    }

}
