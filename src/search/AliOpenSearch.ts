const AliyunSdk = require('waliyun-sdk'); 
import * as Log from '../Logger';
const Errors = require('../Errors');
import Context from '../ctx/Context';

declare module global {
    const config:any;
}


export default class AliOpenSearch {

    public $id = 'AliOpenSearch';
    public $init = 'init';
    public $lazy = true;
    public logger:Log.Logger = Log.create(this);
    public instance:any;

    /**
     * 
     */
    init() {
        this.instance = new AliyunSdk.OpenSearch( global.config.aliyun.search );
    }

    _invoke( ignoreFailStatus:boolean, methodName:string, func:Function, ctx:Context, params:any ) {
        const me = this;

        return new Promise( function(resolve, reject) {
            func.call( me.instance, params, function(err:any, res:any) {
                const resErr = me._hasError( ctx, ignoreFailStatus, methodName, err, res );
                if(resErr) return reject(resErr);

                resolve(res);
            } ); 
        } );
    }


    // 注意, fieldsArray 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    _push( ctx:Context, cmd:string, methodName:string, indexName:string, table_name:string, fieldsArray:any[] ) {
        const timestamp = (new Date()).getTime();
        const items = fieldsArray.map( fields => ({cmd, timestamp, fields}) );

        const params = {
            "app_name": indexName,
            "action": "push",
            table_name,
            items
        };

        return this._invoke( false, methodName, this.instance.uploadDoc, ctx, params );
    }


    batch( ctx:Context, indexName:string, table_name:string, cmdArray:string[], fieldsArray:any[] ) {
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
            table_name,
            items
        };

        return this._invoke( false, 'batch', this.instance.uploadDoc, ctx, params );
    }


    _hasError( ctx:Context, ignoreFailStatus:boolean, methodName:string, err:any, res:any ) {
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
    add( ctx:Context, indexName:string, tableName:string, fields:any ) {
        return this.addByArray( ctx, indexName, tableName, [fields] );
    }


    // 注意, fieldsArray 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    addByArray( ctx:Context, indexName:string, tableName:string, fieldsArray:any[] ) {
        return this._push( ctx, 'add', 'add', indexName, tableName, fieldsArray );
    }


    // 注意, fields 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    update( ctx:Context, indexName:string, tableName:string, fields:any ) {
        return this.updateByArray( ctx, indexName, tableName, [fields] );
    }


    // 注意, fieldsArray 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    updateByArray( ctx:Context, indexName:string, tableName:string, fieldsArray:any[] ) {
        return this._push( ctx, 'update', 'updateByArray', indexName, tableName, fieldsArray );
    }


    // 注意, fields 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    delete( ctx:Context, indexName:string, tableName:string, fields:any ) {
        return this.deleteByArray( ctx, indexName, tableName, [fields] );
    }


    // 注意, fieldsArray 下面的所有属性必须全部序列化为字符串, 包括整型. 如 4 必须转换为 "4",否则 sdk 会报验证错误.
    deleteByArray( ctx:Context, indexName:string, tableName:string, fieldsArray:any[] ) {
        return this._push( ctx, 'delete', 'deleteByArray', indexName, tableName, fieldsArray );
    }


    /**
     * 列出有哪些index
     * 
     */
    listIndices( ctx:Context ) {
        return this._invoke( false, 'listIndices', this.instance.listApp, ctx, {} );
    }

    /**
     * 搜索
     * 
     * @param query query子句，详细格式请参考ALI open search API文档
     */
    search( ctx:Context, index_name:string, query:string ) {
        const params = {index_name, query};

        return this._invoke( true, 'search', this.instance.search, ctx, params );
    }

    /**
     * 下拉查询
     * 
     * @param indexName 
     */
    suggest( ctx:Context, index_name:string, query:string, suggest_name:string, hit:number ) {
        const params = {index_name, query, suggest_name, hit};

        return this._invoke( false, 'suggest', this.instance.suggest, ctx, params );
    }

}
