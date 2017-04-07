import MongooseManager = require('./MongooseManager');
import Errors = require('../Errors');
import Exception = require('../Exception');
import Logger = require('../Logger');


export default class MongooseDao {

    constructor( schemaName, instanceName ) {
        if( !schemaName ) throw new Error('schema name not specified');
        this.schemaName = schemaName;

        this.instanceName = instanceName;

        this.$init = 'init';
        this.$lazy = true;
        
        this.logger = Logger.create('Mongoose.' + (instanceName ? instanceName : '<default>') + '.' + schemaName);
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
    /* protected */_newDocument( values ) {
        return new this.model(values);
    }

    /** 
     * 用id获取document，返回Promise<document> 
     */
    get( ctx, id ) {
        return this.model.findById( id, undefined ).exec();
    }

    /** 用id获取document，返回Promise<document>。如果找不到document，则报错 */
    load( ctx, id ) {
        return this.get( ctx, id )
        .then( document => {
            if( !document ) throw new Exception( Errors.ENTITY_NOT_FOUND, this.schemaName, id );
            return document;
        } );
    }

    /** 查询表中是否至少有一行，返回Promise<boolean> */
    hasOne( ctx ) {
        /* eslint no-unused-vars: 'off' */
        return this.model.findOne( null, '_id' ).exec()
        .then(document => (undefined !== document && null !== document));
    }

    /** 用id数组获取对应的数据对象，返回Promise<document[]> */
    list( ctx, idArray ) {
        return this.map( ctx, idArray, false )
        .then( documentMap => idArray.map( id => documentMap[id] ) );
    }

    
    /**
     * 分页获取所有的数据
     */
    listAll( ctx, offset, limit, total, sorter ) {
        const criteria = {};
        const selectIdOnly = false;
        return total ? 
            this._pageAndCount( ctx, criteria, offset, limit, selectIdOnly, sorter ) 
          : this._page( ctx, criteria, offset, limit, selectIdOnly, sorter );
    }

    
    /**
     * 分页获取所有的数据
     */
    queryId( ctx, offset, limit, total, sorter, criteria ) {
        criteria = criteria || {};
        const selectIdOnly = true;
        return total ? 
            this._pageAndCount( ctx, criteria, offset, limit, selectIdOnly, sorter ) 
          : this._page( ctx, criteria, offset, limit, selectIdOnly, sorter );
    }


    /** 用id数组获取对应的数据对象，返回Promise<{id->document}> */
    map( ctx, idArray ) {
        return this.model.find( {_id: {$in: idArray}}, undefined ).exec()
            .then( documentArray => {
                const r = {};
                documentArray.forEach( function(document) {
                    const id = document._id;
                    r[id] = document;
                } );
                return r;
            } );
    }

    /** 判断指定document是否存在，返回Promise<boolean> */
    exists( ctx, id ) {
        return this.get( ctx, id, '_id' ).then( amount => amount > 0 );
    }

    /** 计数，返回Promise<integer> */
    /* protected */_count( ctx, criteria ) {
        return this.model.count(criteria).exec();
    }

    /** 分页查询，返回Promise<document[] */
    /* protected */_page( ctx, criteria, offset, limit, selectIdOnly, sorter ) {
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
    /* protected */_pageAndCount( ctx, criteria, offset, limit, selectIdOnly, sorter ) {
        //TODO: mongodb有没有提供单次命令？
        const countP = this._count( ctx, criteria );
        const pageP = this._page( ctx, criteria, offset, limit, selectIdOnly, sorter );
        return Promise.all( [countP, pageP] )
        .then( results => {
            return {rows: results[1], total: results[0], offset, limit};
        });
    }

    update( ctx, document ) {
        return document.update();
    }

    /** 用id取得一个document，然后更新这个document，返回Promise<document> */
    updateById( ctx, id, document ) {
        const options = {
            new: true,
            upsert: false
        };
        return this.model.findByIdAndUpdate( id, document, options ).exec()
            .then( document => {
                if( !document ) throw new Exception( Errors.ENTITY_NOT_FOUND, this.schemaName, id );
                return document;
            } );
    }

    /** 创建一个document，返回Promise<document> */
    insert( ctx, document ) {
        return this._newDocument(document).save();
    }

    remove( ctx, document ) {
        return document.remove();
    }

    removeById( ctx, id ) {
        return this.model.findByIdAndRemove(id).exec()
            .then( document => {
                if( !document ) throw new Exception( Errors.ENTITY_NOT_FOUND, this.schemaName, id );
                return document;
            } );
    }

}

