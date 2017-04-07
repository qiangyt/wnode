import ApiRole = require('../ApiRole');
const Errors = require('../Errors');
import marked = require('marked');


//hint: use MWeb Lite to view blueprint

/**
 *
 */
export default class GetBlueprintAPI {

    constructor() {
        this.$id = 'GetBlueprintAPI';
        this.$ApiServer = null;
        this.$SwaggerHelper = null;
        this.$BlueprintHelper = null;
    }

    check( ctx, apiName /* required:false */ ) {
        if( apiName ) {
            if( !this.$ApiServer.apiDefinitions[apiName] ) {
                return ctx.error( Errors.API_NOT_FOUND, apiName );
            }
        }

        ctx.ok();
    }

    exec( ctx, 
        apiName /* required:false */, 
        html /* type:'boolean', required:false, description:'true:输出html' */,
        ignoreInternalApi /* required:false, type:'boolean', description:'是否忽略内部API，默认为true' */,
        ignoreGetSwaggerApi /* required:false, type:'boolean', description:'是否忽略GetSwagger API，默认为true' */,
        ignoreGetBlueprintApi /* required:false, type:'boolean', description:'是否忽略GetSwagger API，默认为true' */,
        ignoreNames /* required:false, type:'array', items:{type:'string'}, description:'需忽略的API名字，默认无' */ ) {
        
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

