import _ = require('lodash');
import SupportedMIME = require('../SupportedMIME');
import CodePath = require('../util/CodePath');
import Package = require(CodePath.resolve('../package.json'));
import ApiRole = require('../ApiRole');
import Ajv = require('ajv');


export default class SwaggerHelper {

    constructor() {
        this.$id = 'SwaggerHelper';
        this.$Schemas = null;
    }

    buildOptions( ignoreInternalApi, ignoreGetSwaggerApi, ignoreGetBlueprintApi, ignoreNames ) {
        if( ignoreInternalApi === undefined ) ignoreInternalApi = true;
        if( ignoreGetBlueprintApi === undefined ) ignoreGetBlueprintApi = true;
        if( ignoreGetSwaggerApi === undefined ) ignoreGetSwaggerApi = true;
        if( ignoreNames === undefined ) ignoreNames = [];

        return {ignoreInternalApi, ignoreGetBlueprintApi, ignoreGetSwaggerApi, ignoreNames};
    }

    /**
     *
     */
     typeFormat( type, format ) {
         if( type === 'integer' ) {
             if (format) {
                 return format;
             }
             return 'int64';
         }
         if( type === 'number' ) return 'double';
         return undefined;
     }

    /**
     *
     */
    root( apiServer, apiName, options ) {
        const defs = apiServer.apiDefinitions;
        let targetDefs;
        if( apiName ) targetDefs = [defs[apiName]];
        else {
            targetDefs = [];
            for( let n in defs ) targetDefs.push(defs[n]);
        }

        const cfg = global.config.server;

        return {
            swagger: '2.0',
            info: this.info(options),
            host: cfg.host,
            basePath: '/' + cfg.path,
            schemes: ['http', 'https'],
            consumes: ['application/json'],
            produces: SupportedMIME,
            responses: this.generalResponses(options),
            paths: this.paths( targetDefs, options ),
            definitions: this.definitions( targetDefs, options )
        };
    }

    definitions( defs, options ) {
        const r = {};

        const schemaMapByName = this.$Schemas.all();
        Object.assign( r, schemaMapByName );

        const ajv = this.ajv = new Ajv({
            allErrors: false,
            extendRefs: true,
            verbose: true,
            format: 'full'
        });
        for( let schemaName in schemaMapByName ) {
            const defSchemaName = SwaggerHelper.schemaRef(schemaName, false);
            const schema = schemaMapByName[schemaName];
            if( schema.additionalProperties === undefined ) schema.additionalProperties = false;
            ajv.addSchema( schema, defSchemaName );
        }

        for( let d of defs ) {
            if( this.shouldIgnore( d, options ) ) continue;

            let result = d.result;
            if( !result ) {
                result = {description: '(无)'};
            } else if( !result.description ) {
                result.description = '(无)';
            }

            const responseSchema = {};
            Object.assign( responseSchema, SwaggerHelper.errorSchema() );
            responseSchema.properties.data = result;

            const schemaName = this.responseSchemaName(d, options, true);
            r[schemaName] = responseSchema;

            const dataSchemaName = SwaggerHelper.schemaRef(schemaName, false) + 'Data';
            ajv.addSchema( result, dataSchemaName );
        }
        return r;
    }

    /**
     *
     */
    paths( defs, options ) {
        const r = {};
        for( let d of defs ) {
            if( this.shouldIgnore( d, options ) ) continue;

            r['/' + d.name] = this.path( d, options );
        }
        return r;
    }

    shouldIgnore(def, options) {
        const name = def.name;

        if( options.ignoreGetSwaggerApi && name === 'GetSwagger' ) return true;
        if( options.ignoreGetBlueprintApi && name === 'GetBlueprint' ) return true;

        for( let ignoreName of options.ignoreNames ) {
            if( ignoreName === name ) {
                return true;
            }
        }

        if( options.ignoreInternalApi ) {
            let isInternalAll = true;
            for( let role of def.roles ) {
                if( !ApiRole.isInternal(role) ) {
                    isInternalAll = false;
                }
            }
            if (isInternalAll) return true;
        }

        return false;
    }

    /**
     *
     */
    info() {
        const r = {
            title: global.config.server.name,
            description: Package.description,
            version: Package.version,
            contact: {
                email: Package.author
            }
        };

        const swaggerCfg = global.config.swagger;
        if( swaggerCfg && swaggerCfg.info ) _.merge( r, swaggerCfg.info );

        return r;
    }

    /**
     *
     */
    parameter( p ) {
        const r = {
            name: p.name,
             "in": p["in"],
            description: p.description,
            required: p.required,
            format: this.typeFormat( p.type, p.format ),
            allowEmptyValue: false, // TODO: default=false is not good enough
            items: p.items
            //'default': //TODO
            //'enum': //TOOD
        };

        let type = p.type;
        if( type === 'date' ) {
            // swagger 'type' doesn't support date, so we should extend it
            type = 'integer';
            r.format = 'long';
            r['x-type'] = 'date';
        }
        r.type = type;

        let inValue = p['in'];
        if( inValue === 'cookie' ) {
            // swagger 'in' doesn't support cookie, so we should extend it
            r['x-in'] = inValue;
            inValue = 'query';
        }
        r['in'] = inValue;

        return r;
    }

    /**
     *
     */
    path( d, options ) {
        const r = {};

        const parameters = [];
        for( let name in d.spec.parameters ) {
            if( name === 'ctx' ) continue;
            const p = d.spec.parameters[name];
            if( p['in'] === 'internal' ) continue;
            parameters.push( this.parameter( p, options ) );
        }

        r[d.method] = {
            tags: [global.config.server.name],
            "x-openApi": d.openApi || false,
            "x-timeout": d.timeout,
            summary: d.summary,
            description: d.description,
            operationId: d.name,
            consumes: ['application/json'],
            produces: [d.produce],
            parameters: parameters,
            responses: this.response( d, options ),
            schemes: ['http', 'https']
        };

        return r;
    }

    /**
     *
     */
    response( d, options ) {
        return {
            '200': {
                description: '成功时返回code="0"，和data',
                schema: {
                    $ref: this.responseSchemaRef(d, options, true)
                }
            }
        };
    }


    /**
     *
     */
    generalResponses() {
        return {
            '200': {
                description: SwaggerHelper.errorSchema().properties.code.description,
                schema: {
                    $ref: SwaggerHelper.schemaRef( 'Error', false )
                }
            },
            'default': {
                'description': '设计外的错误'
            }
        };
    }

    localResponseSchemaName( def ) {
        return def.name + 'Response';
    }

    responseSchemaName( def, options, prefixWithServiceName) {
        const localName = this.localResponseSchemaName( def, options );
        return SwaggerHelper.schemaName( localName, prefixWithServiceName );
    }

    responseSchemaRef( def, options, prefixWithServiceName ) {
        const localName = this.localResponseSchemaName( def, options );
        return SwaggerHelper.schemaRef( localName, prefixWithServiceName );
    }

    static schemaName(localName, prefixWithServiceName) {
        localName = localName.replace('/', '');
        if( prefixWithServiceName === undefined || prefixWithServiceName !== false ) {
            return _.upperFirst(global.config.server.name) + _.upperFirst(localName);
        }
        return localName;
    }

    static schemaRef(localName, prefixWithServiceName) {
        const fqName = SwaggerHelper.schemaName(localName, prefixWithServiceName);
        return '#/definitions/' + fqName;
    }

    static errorSchema() {
        return {
            type: 'object',
            required: [
                "code",
                "time",
                "rid",
                "cid"
            ],
            properties: {
                code: {
                    type: 'string',
                    description: '结果指示代码。"0"表示成功，"data"中返回数据；非"0"表示失败, "data"中无数据'
                },
                key: {
                    type: 'string',
                    description: '错误代码（英文）。仅失败时出现，指示具体的出错原因'
                },
                message: {
                    type: 'string',
                    description: '错误消息（i18n-ed)。仅失败时出现，指示具体的出错原因'
                },
                time: {
                    type: 'integer',
                    format: 'int64',
                    description: '接口调用的时间（1970首日到现在的毫秒数）'
                },
                rid: {
                    type: 'string',
                    description: '本次请求的uuid'
                },
                cid: {
                    type: 'string',
                    description: '本次请求的相关ID'
                }
            }
        };
    }


    validateResponse( def, data ) {
        const responseSchemaName = this.responseSchemaName( def, {}, true );
        const dataSchemaName = SwaggerHelper.schemaRef(responseSchemaName, false) + 'Data';
        const valid = this.ajv.validate(dataSchemaName, data);

        const r = {
            valid: valid,
            api: def.name
        };

        if( valid ) return r;

        return {
            valid: false,
            errorsText: this.ajv.errors,
            api: def.name
        };
    }


}
