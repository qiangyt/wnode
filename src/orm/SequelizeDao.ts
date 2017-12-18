import * as _ from 'lodash';
import * as Sequelize from 'sequelize';
const Errors = require('../Errors');
import Exception from '../Exception';
import * as Log from '../Logger';
import * as Promise from 'bluebird';// 因为sequelizer使用bluebird的Promise，所以我们这里也必须使用bluebird
import Context from '../ctx/Context';
import SequelizerManager from './SequelizerManager';
import SequelizerTx from './SequelizerTx';


export default class SequelizeDao {

    public $init = 'init';
    public sequelizer:Sequelize.Sequelize;
    public model:Sequelize.Model<any,any>;
    public logger:Log.Logger;
    

    constructor( public modelName:string, public instanceName:string ) {
        this.logger = Log.create('Sequelizer.' + (instanceName ? instanceName : '<default>') + '.' + modelName);
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
        return (<any>this.model).primaryKeyAttributes;
    }

    /** 绑定事务，如果当前存在事务(在ctx.tx中保存)的话。如果ctx.ignoreTx，那么忽略事务 */
    _withTx( ctx:Context, options:any ):Promise<any> {
        const tx = ctx.tx;
        if( tx && !tx.ignore ) {
            // TODO: 事务开启时，同一个连接上所有操作必须串行执行，即不允许并发操作，因此，
            // 我们有必要检查并确保这种串行性。
            return tx.enlist( new SequelizerTx(this.sequelizer) )
            .then( (txData:any) => {
                if( !options ) options = {};
                options.transaction = txData;
                return options;
            } );
        }
        return Promise.resolve(options);
    }


    /** 构造一个带where条件的options */
    _where( options:Sequelize.FindOptions<any> ) {
        if( !options ) options = {};
        if( !options.where ) options.where = {};
        return options;
    }

    /** 用id获取entity，返回Promise<entity> */
    get( ctx:Context, id:string|number, options:Sequelize.FindOptions<any> ):Promise<any> {
        return this._withTx( ctx, options )
        .then( (options:Sequelize.FindOptions<any>) => this.model.findById( id, options ) );
    }

    /** 用id获取entity，返回Promise<entity>。如果找不到entity，则报错 */
    load( ctx:Context, id:string|number, options:Sequelize.FindOptions<any> ) {
        return this.get( ctx, id, options ).then( (entity:any) => {
            if( !entity ) this.raiseEntityNotFoundError(id);
            return entity;
        } );
    }

    raiseEntityNotFoundError(id:string|number) {
        throw new Exception( Errors.ENTITY_NOT_FOUND, this.modelName, id );
    }

    /** 用id数组获取对应的数据对象，返回Promise<entity[]> */
    list( ctx:Context, idArray:Array<string|number>, options:Sequelize.FindOptions<any> ):Promise<any> {
        if( !idArray || !idArray.length ) return Promise.resolve([]);
        
        options = this._where(options );
        const idField = this.idFields()[0];
        (<any>options.where)[idField] = <Sequelize.WhereOptions<any>>{$in: idArray};//TODO: 尚不支持composite primary key
        return this.findAll( ctx, options );
    }

    /** 用id数组获取对应的数据对象，保持和idArray里一样的顺序，返回Promise<entity[]> */
    orderedList( ctx:Context, idArray:Array<string|number>, options:Sequelize.FindOptions<any> ):Promise<any[]> {
        if( !idArray || !idArray.length ) return Promise.resolve([]);
        
        return this.map( ctx, idArray, options )
        .then( mapById => idArray.map( id => mapById[id] ) );
    }

    /** 用id数组获取对应的数据对象，返回Promise<{id->entity}> */
    map( ctx:Context, idArray:Array<string|number>, options:Sequelize.FindOptions<any> ) {
        if( !idArray || !idArray.length ) return Promise.resolve({});
        
        const idField = this.idFields()[0];

        options = options || {};

        options.attributes = options.attributes || [];
        (<any>options.attributes).push(idField);

        return this.list( ctx, idArray, options )
        .then( (entityArray:any[]) => {
            const r:any = {};
            entityArray.forEach( function(entity) {
                const id = entity.get(idField);
                r[id] = entity;
            } );
            return r;
        } );
    }

    /** 用id数组获取对应的field，返回Promise<{id->field}> */
    fieldMap( ctx:Context, idArray:Array<string|number>, fieldName:string, options:Sequelize.FindOptions<any> ) {
        if( !idArray || !idArray.length ) return Promise.resolve({});

        const idField = this.idFields()[0];

        options = options || {};

        options.attributes = options.attributes || [];
        (<any>options.attributes).push(idField);
        (<any>options.attributes).push(fieldName);

        return this.list( ctx, idArray, options )
        .then( (entityArray:any[]) => {
            const r:any = {};
            entityArray.forEach( function(entity) {
                const id = entity.get(idField);
                r[id] = entity.get(fieldName);
            } );
            return r;
        } );
    }

    /** 任意查询，返回多行结果，返回Promise<entity[]> */
    findAll( ctx:Context, options?:Sequelize.FindOptions<any> ) {
        return this._withTx( ctx, options )
        .then( (options:Sequelize.FindOptions<any>) => this.model.findAll(options) );
    }

    /** 同findAll */
    find( ctx:Context, options?:Sequelize.FindOptions<any> ) {
        return this.findAll( ctx, options );
    }

    /** 任意查询，返回1行结果，返回Promise<entity> */
    findOne( ctx:Context, options?:Sequelize.FindOptions<any> ) {
        return this._withTx( ctx, options )
        .then( (options:Sequelize.FindOptions<any>) => {
            return this.model.findOne(options);
         } );
    }

    /** 查询表中是否至少有一行，返回Promise<boolean> */
    hasOne( ctx:Context ) {
        return this.findOne(ctx).then((entity:any) => (undefined !== entity && null !== entity));
    }

    /** 分页查询，返回Promise<entity[] */
    page( ctx:Context, options?:Sequelize.FindOptions<any>, offset=0, limit=0 ) {
        if( !options ) options = {};
        _.merge( options, {limit, offset} );
        return this.findAll( ctx, options );
    }

    /** 分页查询并返回总行数，返回Promise<{rows:entity[], count:integer}> */
    pageAndCount( ctx:Context, options?:Sequelize.FindOptions<any>, offset=0, limit=0 ) {
        if( !options ) options = {};
        _.merge( options, {limit, offset} );

        return this._withTx( ctx, options )
        .then( options => this.model.findAndCountAll(options) );
    }

    /** 判断指定entity是否存在，返回Promise<boolean> */
    exists( ctx:Context, id:string|number, options?:Sequelize.FindOptions<any> ) {
        options = this._where(options);
        const idField = this.idFields()[0];
        (<any>options.where)[idField] = id;//TODO: 尚不支持composite primary key
        return this.count( ctx, options ).then( amount => amount > 0 );
    }

    /** 计数，返回Promise<integer> */
    count( ctx:Context, options?:Sequelize.FindOptions<any> ) {
        return this._withTx( ctx, options )
        .then( options => this.model.count(options) );
    }

    /** 创建一个entity，返回Promise<entity> */
    insert( ctx:Context, values:any, options?:Sequelize.CreateOptions ) {
        return this._withTx( ctx, options )
        .then( options => this.model.create( values, options ) );
    }
    
    /** 更新一个entity，返回Promise<entity> */
    update( ctx:Context, entity:any, values:any, options?:Sequelize.UpdateOptions ) {
        if( !options ) options = <Sequelize.UpdateOptions>{};
        _.merge( options, {fields: _.keys(values)} );

        return this._withTx( ctx, options )
        .then( options => entity.update( values, options ) );
    }

    /** 用id取得一个entity，然后更新这个entity，返回Promise<entity> */
    updateById( ctx:Context, id:string|number, values:any, options?:Sequelize.UpdateOptions ) {
        return this.load( ctx, id, options )
            .then( (entity:any) => this.update( ctx, entity, values, options ) );
    }
    
    /** 创建或更新一个entity */
    upsert( ctx:Context, values:any, options?:Sequelize.UpsertOptions ) {
        return this._withTx( ctx, options )
        .then( options => this.model.upsert( values, options ) );
    }

    /** 递增一组field，返回Promise<entity> */
    inc( ctx:Context, entity:any, fields:any[], options?:Sequelize.UpdateOptions ) {
        return this._withTx( ctx, options )
        .then( options => entity.increment( fields, options ) );
    }

    /** 用id取得一个entity，然后递增这个entity的一组field，返回Promise<entity> */
    incById( ctx:Context, id:string|number, fields:any[], options?:Sequelize.UpdateOptions ) {
        return this.load( ctx, id, options )
            .then( (entity:any) => this.inc( ctx, entity, fields, options ) );
    }

    /** 递减一组field，返回Promise<entity> */
    dec( ctx:Context, entity:any, fields:any[], options?:Sequelize.UpdateOptions ) {
        return this._withTx( ctx, options )
        .then( options => entity.decrement( fields, options ) );
    }

    /** 用id取得一个entity，然后递减这个entity的一组field，返回Promise<entity> */
    decById( ctx:Context, id:string|number, fields:any[], options?:Sequelize.UpdateOptions ) {
        return this.load( ctx, id, options )
            .then( (entity:any) => this.dec( ctx, entity, fields, options ) );
    }

    remove( ctx:Context, entity:any, options?:Sequelize.DestroyOptions ) {
        return this._withTx( ctx, options )
        .then( options => entity.destroy(options) );
    }

    removeById( ctx:Context, id:string|number, options?:Sequelize.DestroyOptions ) {
        return this.load( ctx, id, options )
            .then( (entity:any) => this.remove( ctx, entity, options ) );
    }

    distinctFields( ctx:Context, fieldName:string, options?:Sequelize.FindOptions<any> ) {
        options = this._where(options );

        const attribs:any = (<any>this.model).attributes;
        const columnName = (<any>attribs)[fieldName].field;
        _.merge( options, {
            attributes:[[Sequelize.literal('distinct `' + columnName + '`'), fieldName]]
        } );

        const nullable:boolean = (<any>options).nullable || false;
        if( nullable === false ) {
            (<any>options.where)[fieldName] = <Sequelize.WhereOptions<any>>{$ne: null};
        }

        return this.findAll( ctx, options )
        .then( fieldValues => fieldValues.map( row => row[fieldName] ) );
    }

}
