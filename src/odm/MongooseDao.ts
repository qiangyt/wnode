import MongooseManager from './MongooseManager';
import MongooseInstance from './MongooseInstance';
import * as Mongoose from 'mongoose';
const Errors = require('../Errors');
import Exception from '../Exception';
import * as Log from '../Logger';
import Context from '../ctx/Context';


export default class MongooseDao {

    public $init = 'init';
    public $lazy = true;
    public instance:MongooseInstance;
    public logger:Log.Logger;
    public schema:Mongoose.Schema;
    public model:Mongoose.Model<any>;


    constructor( public schemaName:string, public instanceName:string ) {
        this.logger = Log.create('Mongoose.' + (instanceName ? instanceName : '<default>') + '.' + schemaName);
    }


    _resolveInstance() {
        let r = this.instance;
        if( !r ) r = this.instance = MongooseManager.instance.get(this.instanceName);
        return r;
    }


    /**
     * 初始化
     */
    /* protected */init() {
        const inst = this._resolveInstance();

        const s = this.schema = inst.schemas[this.schemaName];
        if( !s ) throw new Error('schema ' + this.schemaName + ' not found');

        this.model = inst.models[this.schemaName];
    }


    /* 生成一个新的document对象 */
    /* protected */_newDocument( values:any ) {
        return new this.model(values);
    }

    /** 
     * 用id获取document，返回Promise<document> 
     */
    get( ctx:Context, id:string|number ):Promise<Object> {
        return this.model.findById( id, undefined ).exec();
    }

    /** 用id获取document，返回Promise<document>。如果找不到document，则报错 */
    load( ctx:Context, id:string|number ):Promise<Object> {
        return this.get( ctx, id )
        .then( document => {
            if( !document ) this.raiseEntityNotFoundError(id);
            return document;
        } );
    }

    raiseEntityNotFoundError(id:string|number) {
        throw new Exception( Errors.ENTITY_NOT_FOUND, this.schemaName, id );
    }

    /** 查询表中是否至少有一行，返回Promise<boolean> */
    hasOne( ctx:Context ):Promise<boolean> {
        /* eslint no-unused-vars: 'off' */
        return this.model.findOne( null, '_id' ).exec()
        .then(document => (undefined !== document && null !== document));
    }

    /** 用id数组获取对应的数据对象，返回Promise<document[]> */
    list( ctx:Context, idArray:string[]|number[] ):Promise<Object[]> {
        return this.map( ctx, idArray )
        .then( (documentMap:any) => {
            //return idArray.map( (id:string|number) => documentMap[id] );
            const r:Object[] = [];
            for( let id in documentMap ) {
                const doc = documentMap[id];
                r.push(doc);
            }
            return r;
         } );
    }


    /** 用id数组获取对应的数据对象，返回Promise<{id->document}> */
    map( ctx:Context, idArray:string[]|number[] ):Promise<Object> {
        return this.model.find( {_id: {$in: idArray}}, undefined ).exec()
            .then( documentArray => {
                const r:any = {};
                documentArray.forEach( function(document) {
                    const id = document._id;
                    r[id] = document;
                } );
                return r;
            } );
    }

    
    /**
     * 分页获取所有的数据
     */
    listAll( ctx:Context, offset:number, limit:number, total:boolean, sorter:string|Object ) {
        const criteria = {};
        const selectIdOnly = false;
        return total ? 
            this._pageAndCount( ctx, criteria, offset, limit, selectIdOnly, sorter ) 
          : this._page( ctx, criteria, offset, limit, selectIdOnly, sorter );
    }

    
    /**
     * 分页获取所有的数据
     */
    queryId( ctx:Context, offset:number, limit:number, total:boolean, sorter:string|Object, criteria:Object ) {
        criteria = criteria || {};
        const selectIdOnly = true;
        return total ? 
            this._pageAndCount( ctx, criteria, offset, limit, selectIdOnly, sorter ) 
          : this._page( ctx, criteria, offset, limit, selectIdOnly, sorter );
    }

    /** 判断指定document是否存在，返回Promise<boolean> */
    exists( ctx:Context, id:string|number ):Promise<boolean> {
        return this.get( ctx, id ).then( amount => amount > 0 );
    }

    /** 计数，返回Promise<integer> */
    /* protected */_count( ctx:Context, criteria:Object ) {
        return this.model.count(criteria).exec();
    }

    /** 分页查询，返回Promise<document[] */
    /* protected */_page( ctx:Context, criteria:Object, offset:number, limit:number, selectIdOnly:boolean, sorter:string|Object ):Promise<Object[]> {
        const projection = selectIdOnly ? {id:1} : undefined;
        
        let r = this.model.find( criteria, projection ).skip(offset).limit(limit);

        if( sorter ) r = r.sort(sorter);
        
        if( selectIdOnly ) {
            r = r.select({id:1});
            return r.exec()
            .then( documentArray => {
                return documentArray.map(document => document._id);
             } );
        }

        return r.exec();
    }

    /** 分页查询并返回总行数，返回Promise<{rows:document[], count:integer}> */
    /* protected */_pageAndCount( ctx:Context, criteria:Object, offset:number, limit:number, selectIdOnly:boolean, sorter:string|Object ) {
        //TODO: mongodb有没有提供单次命令？
        const countP = this._count( ctx, criteria );
        const pageP = this._page( ctx, criteria, offset, limit, selectIdOnly, sorter );
        return Promise.all( [countP, pageP] )
        .then( results => {
            return {rows: results[1], total: results[0], offset, limit};
        });
    }

    update( ctx:Context, document:any ):Promise<Object> {
        return document.update();
    }

    /** 用id取得一个document，然后更新这个document，返回Promise<document> */
    updateById( ctx:Context, id:string|number, document:Object ):Promise<Object> {
        const options = {
            new: true,
            upsert: false
        };
        return this.model.findByIdAndUpdate( id, document, options ).exec()
            .then( document => {
                if( !document ) this.raiseEntityNotFoundError(id);
                return document;
            } );
    }

    /** 创建一个document，返回Promise<document> */
    insert( ctx:Context, document:Object ):Promise<Object> {
        return this._newDocument(document).save();
    }

    remove( ctx:Context, document:any ):Promise<Object> {
        return document.remove();
    }

    removeById( ctx:Context, id:string|number ):Promise<Object> {
        return this.model.findByIdAndRemove(id).exec()
            .then( document => {
                if( !document ) this.raiseEntityNotFoundError(id);
                return document;
            } );
    }

}

