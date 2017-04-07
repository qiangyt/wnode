import ApiParameter from './ApiParameter';
import * as ApiRole from './ApiRole';
import * as Util from 'util';
import * as Path from 'path';
import SupportedMIME from './SupportedMIME';


export default class ApiDefinition {

    constructor( name ) {
        this.name = name;
        this.specs = {operationId: name};
        this.roles = [];

        this.callCheck = this.callCheck.bind(this);
        this.callExec = this.callExec.bind(this);
    }


    /**
     *
     */
    static validatedApiRoles( apiName, mod ) {
        const modRole = mod.role;

        if( modRole === undefined ) return [ApiRole.user];

        if( Util.isArray(modRole) === false ) {
            return [ApiDefinition.validatedApiRole( apiName, modRole )];
        }

        const result = [];
        for( let r of modRole ) {
            result.push( ApiDefinition.validatedApiRole( apiName, r ) );
        }
        return result;
    }

    /**
     *
     */
    static validatedApiRole( apiName, role ) {
        if( ApiRole.hasValue(role) ) return role;
        throw new Error( 'API ' + apiName + ': unknown role value: ' + role );
    }

    /**
     *
     */
    static validatedApiSummary( apiName, summary ) {
        if( summary === null || summary === undefined || summary === '' ) {
            throw new Error( 'API ' + apiName + ': summary could NOT be blank' );
        }
        if( summary.length >= 120 ) {
            throw new Error( 'API' + apiName + ': summary SHOULD be less than 120 characters' );
        }
        return summary;
    }

    /**
     *
     */
    static validatedApiProduce( apiName, produce ) {
        if( produce ) {
            if( SupportedMIME.indexOf(produce) < 0 ) {
                throw new Error( 'API ' + apiName + ': ' + produce +
                        ' is NOT supported MIME. The supported are ' + Util.inspect(SupportedMIME) );
            }
        } else {
            produce = 'application/json';
        }
        return produce;
    }

    /**
     *
     */
    static validatedResult( apiName, result ) {
        //TODO
        return result;
    }

    /**
     *
     */
    static build( path ) {
        if( !path.relative ) path.relative = '';

        let apiName = Path.join(path.relative, path.name);
        if( apiName.charAt(0) === '/' ) apiName = apiName.substring(1);

        const mod from path.full);
        
        if( mod.apiName ) {
            // 如果module里自定义了api名字
            apiName = mod.apiName;
        }

        const params = ApiParameter.parseAll( apiName, mod.prototype );

        const def = new ApiDefinition(apiName);
        def.method = params.method;
        def.spec = def.specs[params.method] = {parameters: params.all};
        def.auths = params.auths;
        def.checks = params.checks;
        def.execs = params.execs;
        def.openApi = mod.openApi || false;
        def.timeout = mod.timeout || 1000;
        def.roles = ApiDefinition.validatedApiRoles( apiName, mod );
        def.summary = ApiDefinition.validatedApiSummary( apiName, mod.summary );
        def.description = mod.description;
        def.transactional = mod.transactional;
        def.transactionOptions = mod.transactionOptions;
        def.produce = ApiDefinition.validatedApiProduce( apiName, mod.produce );
        def.isJson = ('application/json' === def.produce);
        def.result = ApiDefinition.validatedResult( apiName, mod.result );
        def.customizeJsonResponse = (mod.customizeJsonResponse === true);

        /*eslint no-unneeded-ternary: "off"*/
        def.validateResponse = (mod.validateResponse === false ) ? false : true;

        global.bearcat.module(mod);
        def.bean = global.bearcat.getBean(path.name);

        return def;
    }

    /**
     *
     */
    respond( ctx, parameters, valueTexts ) {
        // prepare all parameter values
        const allValues = {};

        for( let paramName in parameters ) {
            if( 'ctx' === paramName ) {
                allValues[paramName] = ctx;
                continue;
            }

            const specParam = parameters[paramName];
            if( specParam['in'] === 'internal' ) {
                allValues[paramName] = null;
            } else {
                const valueText = valueTexts[paramName];
                const value = specParam.parseThenCheckValue( ctx, valueText );
                if( ctx.hasError ) return;
                allValues[paramName] = value;
            }
        }

        ctx.bean = this.bean;
        ctx.values = allValues;

        if( ctx.bean.auth ) this.callAuth( ctx );
        else this.callCheck( ctx );
    }

    /**
     * call step method
     */
    callStep( ctx, stage, step, next ) {
        const values = ctx.values;

        ctx.next = next;

        const stepValues = [];
        for( let p of stage ) {
            stepValues.push( values[p.name] );
        }

        try {
            const r = step.apply( ctx.bean, stepValues );
            if( r !== undefined ) {
                if( r.then && r.catch ) {
                    // we use 'r.then && r.catch' to tell if r is a promise instead of 'instanceof Promise',
                    // because old dependent library perhaps uses non-standard 3rd-party promise tools
                    r.then( function(result) {
                        ctx.ok(result);
                    } ).catch( function(err) {
                        ctx.error(err);
                    } );
                } else {
                    if( r instanceof Error ) {
                        ctx.error(r);
                    } else {
                        ctx.ok(r);
                    }
                }
            }
        } catch( err ) {
            ctx.error(err);
        }
    }

    /**
     * call auth() method
     */
    callAuth( ctx ) {
        this.callStep( ctx, this.auths, ctx.bean.auth, this.callCheck );
    }

    /**
     * call exec() method
     */
    callExec( ctx ) {
        // the exec is the final step, so the next step is null
        this.callStep( ctx, this.execs, ctx.bean.exec, null );
    }

    /**
     * call check() method
     */
    callCheck( ctx ) {
        const bean = ctx.bean;
        const values = ctx.values;
        if( !bean.check ) {
            this.callExec( ctx, bean, values );
        } else {
            this.callStep( ctx, this.checks, ctx.bean.check, this.callExec );
        }
    }

    /**
     *
     */
    buildWebUrlSample( path, parameters ) {
        const query = [];

        for( let paramName in parameters ) {
            if( 'ctx' === paramName ) continue;
            if( parameters[paramName]['in'] === 'internal' ) continue;
            query.push( paramName + '={' + paramName + '}' );
        }

        return path + this.name + '?' + query.join( '&' );
    }

}
