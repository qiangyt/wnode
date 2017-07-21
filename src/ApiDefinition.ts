import ApiParameter from './ApiParameter';
import * as ApiRole from './ApiRole';
import * as Util from 'util';
import * as Path from 'path';
import SupportedMIME from './SupportedMIME';
import Context from './ctx/Context';


declare module global {
    const config:any;
    const bearcat:any;
}



export default class ApiDefinition {

    public roles:number[] = [];
    public specs:any;
    public method:string;
    public spec:any;
    public openApi:boolean;
    public timeout:number;
    public summary:string;
    public description:string;
    public transactional:boolean;
    public transactionOptions:any;
    public bean:any;
    public auths:any;
    public execs:any;
    public checks:any;
    public produce:string;
    public isJson:boolean;
    public result:any;
    public customizeJsonResponse:boolean;
    public validateResponse:boolean;
    public charset:string;


    constructor( public name:string ) {
        this.specs = {operationId: name};

        this.callCheck = this.callCheck.bind(this);
        this.callExec = this.callExec.bind(this);
    }


    /**
     *
     */
    static validatedApiRoles( apiName:string, mod:any ) {
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
    static validatedApiRole( apiName:string, role:number ) {
        if( ApiRole.hasValue(role) ) return role;
        throw new Error( 'API ' + apiName + ': unknown role value: ' + role );
    }

    /**
     *
     */
    static validatedApiSummary( apiName:string, summary:string ) {
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
    static validatedApiProduce( apiName:string, produce:string ) {
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
    static validatedResult( apiName:string, result:any ) {
        //TODO
        return result;
    }

    /**
     *
     */
    static build( path:any ) {
        if( !path.relative ) path.relative = '';

        let apiName = Path.join(path.relative, path.name);
        if( apiName.charAt(0) === '/' ) apiName = apiName.substring(1);

        const mod = require(path.full);
        
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
    respond( ctx:Context, parameters:any, valueTexts:any ) {
        // prepare all parameter values
        const allValues:any = {};

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
    callStep( ctx:Context, stage:any, step:Function, next:Function ) {
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
                    r.then( function(result:any) {
                        ctx.ok(result);
                    } ).catch( function(err:any) {
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
    callAuth( ctx:Context ) {
        this.callStep( ctx, this.auths, ctx.bean.auth, this.callCheck );
    }

    /**
     * call exec() method
     */
    callExec( ctx:Context ) {
        // the exec is the final step, so the next step is null
        this.callStep( ctx, this.execs, ctx.bean.exec, null );
    }

    /**
     * call check() method
     */
    callCheck( ctx:Context ) {
        const bean = ctx.bean;
        if( !bean.check ) {
            this.callExec( ctx );
        } else {
            this.callStep( ctx, this.checks, ctx.bean.check, this.callExec );
        }
    }

    /**
     *
     */
    buildWebUrlSample( path:string, parameters:any ) {
        const query = [];

        for( let paramName in parameters ) {
            if( 'ctx' === paramName ) continue;
            if( parameters[paramName]['in'] === 'internal' ) continue;
            query.push( paramName + '={' + paramName + '}' );
        }

        return path + this.name + '?' + query.join( '&' );
    }

}
