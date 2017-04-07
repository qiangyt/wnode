const AliyunSdk = require('@wxcount/aliyun-sdk'); 
import Logger = require('../Logger');
import Errors = require('../Errors');


export default class AliOpenSearch {

    constructor() {
        this.$id = 'AliOpenSearch';
        this.$init = 'init';
        this.$lazy = true;
        
        this.logger = Logger.create(this);
    }

    /**
     * 
     */
    init() {
        this.instance = new AliyunSdk.OpenSearch( global.config.aliyun.search );
    }

    _invoke( ignoreFailStatus, methodName, func, ctx, params, callback ) {
        const me = this;

        if( callback ) {
            func.call( me.instance, params, function(err, res) {
                const resErr = me._hasError( ctx, ignoreFailStatus, methodName, err, res );
                if(resErr) return ctx.error(resErr);

                return ctx.callback( callback, res );
            } );
            return undefined;
        }

        return new Promise( function(resolve, reject) {
            func.call( me.instance, params, function(err, res) {
                const resErr = me._hasError( ctx, ignoreFailStatus, methodName, err, res );
                if(resErr) return reject(resErr);

                resolve(res);
            } ); 
        } );
    }


    // 注意, fieldsArray 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    _push( ctx, cmd, methodName, indexName, tableName, fieldsArray, callback ) {
        const timestamp = (new Date()).getTime();
        const items = fieldsArray.map( fields => ({cmd, timestamp, fields}) );

        const params = {
            "app_name": indexName,
            "action": "push",
            "table_name": tableName,
            items
        };

        return this._invoke( false, methodName, this.instance.uploadDoc, ctx, params, callback );
    }


    batch( ctx, indexName, tableName, cmdArray, fieldsArray, callback ) {
        if( cmdArray.length !== fieldsArray.length ) {
            throw new Error('unmatched cmd and fields');
        }

        const timestamp = (new Date()).getTime();
        
        const items = [];
        for( let i = 0; i < fieldsArray.length; i++ ) {
            const fields = fieldsArray[i];
            const cmd = cmdArray[i];
            items.push({cmd, timestamp, fields});
        }

        const params = {
            "app_name": indexName,
            "action": "push",
            "table_name": tableName,
            items
        };

        return this._invoke( false, 'batch', this.instance.uploadDoc, ctx, params, callback );
    }


    _hasError( ctx, ignoreFailStatus, methodName, err, res ) {
        if(err) return err;

        const statusIsOk = (res.status === 'OK');

        const resErrors = res.errors;
        if( resErrors && resErrors.length > 0 ) {
            if( statusIsOk || ignoreFailStatus ) {
                // 如果statusIsOk是true，说明这些error是warning，不影响实际结果
                this.logger.warn( {ctx, openSearchErrors: resErrors, openSearchMethod: methodName}, 'ali open search warning' );
            } else {
                this.logger.error( {ctx, openSearchResponse: res, openSearchMethod: methodName}, 'ali open search error' );

                const errCode = resErrors[0].code;
                return ( 3007 === errCode || 6015 === errCode ) ? Errors.SYSTEM_BUSY : Errors.INTERNAL_ERROR;
            }
        }

        return undefined;
    }

    // 注意, fields 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    add( ctx, indexName, tableName, fields, callback ) {
        return this.addByArray( ctx, indexName, tableName, [fields], callback );
    }


    // 注意, fieldsArray 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    addByArray( ctx, indexName, tableName, fieldsArray, callback ) {
        return this._push( ctx, 'add', 'add', indexName, tableName, fieldsArray, callback );
    }


    // 注意, fields 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    update( ctx, indexName, tableName, fields, callback ) {
        return this.updateByArray( ctx, indexName, tableName, [fields], callback );
    }


    // 注意, fieldsArray 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    updateByArray( ctx, indexName, tableName, fieldsArray, callback ) {
        return this._push( ctx, 'update', 'updateByArray', indexName, tableName, fieldsArray, callback );
    }


    // 注意, fields 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    delete( ctx, indexName, tableName, fields, callback ) {
        return this.deleteByArray( ctx, indexName, tableName, [fields], callback );
    }


    // 注意, fieldsArray 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    deleteByArray( ctx, indexName, tableName, fieldsArray, callback ) {
        return this._push( ctx, 'delete', 'deleteByArray', indexName, tableName, fieldsArray, callback );
    }


    /**
     * 列出有哪些index
     * 
     */
    listIndices( ctx, callback ) {
        return this._invoke( false, 'listIndices', this.instance.listApp, ctx, {}, callback );
    }

    /**
     * 搜索
     * 
     * @param query query子句，详细格式请参考ALI open search API文档
     */
    search( ctx, indexName, query, callback ) {
        const params = {
            'index_name': indexName,
            'query': query
        };

        return this._invoke( true, 'search', this.instance.search, ctx, params, callback );
    }

    /**
     * 下拉查询
     * 
     * @param indexName 
     */
    suggest( ctx, indexName, query, suggestName, hit, callback ) {
        const params = {
            'index_name': indexName,
            'query': query,
            'suggest_name': suggestName,
            'hit': hit
        };

        return this._invoke( false, 'suggest', this.instance.suggest, ctx, params, callback );
    }

}
