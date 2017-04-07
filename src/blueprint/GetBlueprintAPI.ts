import * as ApiRole from '../ApiRole';
const Errors = require('../Errors');
import * as marked from 'marked';
import ApiServer from '../ApiServer';
import SwaggerHelper from '../swagger/SwaggerHelper';
import BlueprintHelper from './BlueprintHelper';
import BaseContext from '../ctx/BaseContext';

//hint: use MWeb Lite to view blueprint

/**
 *
 */
export default class GetBlueprintAPI {

    public $id = 'GetBlueprintAPI';
    public $ApiServer:ApiServer = null;
    public $SwaggerHelper:SwaggerHelper = null;
    public $BlueprintHelper:BlueprintHelper = null;


    check( ctx:BaseContext, apiName:string /* required:false */ ) {
        if( apiName ) {
            if( !this.$ApiServer.apiDefinitions[apiName] ) {
                return ctx.error( Errors.API_NOT_FOUND, apiName );
            }
        }

        ctx.ok();
    }

    exec( ctx:BaseContext, 
        apiName:string /* required:false */, 
        html:boolean /* type:'boolean', required:false, description:'true:输出html' */,
        ignoreInternalApi:boolean /* required:false, type:'boolean', description:'是否忽略内部API，默认为true' */,
        ignoreGetSwaggerApi:boolean /* required:false, type:'boolean', description:'是否忽略GetSwagger API，默认为true' */,
        ignoreGetBlueprintApi:boolean /* required:false, type:'boolean', description:'是否忽略GetSwagger API，默认为true' */,
        ignoreNames:boolean /* required:false, type:'array', items:{type:'string'}, description:'需忽略的API名字，默认无' */ ) {
        
        const options = this.$SwaggerHelper.buildOptions( ignoreInternalApi, ignoreGetSwaggerApi, ignoreGetBlueprintApi, ignoreNames );

        this.$BlueprintHelper.output( this.$ApiServer, apiName, options, function(err, blueprint) {
            if( err ) return ctx.error( err );

            if( !html ) return ctx.ok(blueprint);

            ctx.produce = 'text/html';
            return ctx.ok(marked(blueprint));
        } );
    }

}

Object.assign( GetBlueprintAPI, {
    apiName:   'GetBlueprint',
    role:       ApiRole.any,
    summary:    '获取blueprint格式的接口文档',
    produce:    'text/markdown',
    charset:    'utf-8',
    result: { 
        description: 'blueprint格式的接口文档',
        schema: {
            type: 'string'
        }
    }
} );

