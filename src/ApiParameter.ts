const Errors = require('./Errors');
import Context from './ctx/Context';

/*
 *
 * @see http://swagger.io/specification/#parameterObject
 * Note:
 *  1) We don't yet support all of parameter attributes.
 *     See the constructor for what we supported so far.
 *  2) We don't yet support semantics of all parameter attributes.
 *     See attribute comments respectively.
 */
export default class ApiParameter {

    // string. see http://swagger.io/specification/#parameterIn
        // The location of the parameter.
        // Now we only support subset of swagger spec: "query", "body", "cookie", "internal"
    public in = 'query';

        // string.
        // A brief description of the parameter.
        // This could contain examples of use.
        // GFM(https://help.github.com/articles/github-flavored-markdown)
        // syntax can be used for rich text representation
   public description = '';

        // boolean.
        // Determines whether this parameter is mandatory.
        // If the parameter is in "path", this property is required and its
        // value MUST be true. Otherwise, the property MAY be included and its
        // default value is false.
   public required = true;

        // string.
        // If 'in' is not 'body', then the type of the parameter.
        // Required. The type of the parameter. Since the parameter is not
        // located at the request body, it is limited to simple types (that is,
        // not an object). The value MUST be one of "string", "number",
        // "integer", "boolean", "date"
        // Note:
        //      1) For simplicity, we don't support 'file' by swagger. File
        //          should be uploaded then be url.
        //      2) We don't yet support 'array' by swagger.
   public type = 'string';

   public method = 'get';

   public items:any[];

   public format:string;

    /**
     * @param name parameter name
     */
    constructor( public apiName:string, public name:string ) {
    }

    /**
     *
     */
    /* eslint complexity: ["error", 16] */
    parseThenCheckValue( ctx:Context, value:any ) {
        // step 1, required check
        if( undefined === value ) {
            if( this.in === 'cookie' ) value = ctx.getCookie(this.name);
            if( undefined === value ) {
                if( this.required ) ctx.error( Errors.MISSING_PARAMETER, this.name );
                return undefined;
            }
        }

        const expectedType = this.type;
        const realType = typeof value;
        if( realType === expectedType ) {
            if( 'boolean' === realType ) return value ? 1 : 0;
            return value;
        }

        // step 2, type check and conversion
        //TODO: optimize it by function dispatcher
        if( 'string' === expectedType ) {
            if( null === value ) return null;
            if( 'string' !== typeof value ) return '' + value;
            return value;
        }

        if( 'number' === expectedType ) {
            const result = parseFloat( value );
            if( isNaN(result) ) return ctx.error( Errors.PARAMETER_NOT_A_NUMBER, value, this.name );
            if( isFinite(result) ) return ctx.error( Errors.INFINITE_PARAMETER_VALUE, this.name, value );
            return result;
        }

        if( 'integer' === expectedType ) {
            const result = parseInt( value, 10 );
            if( isNaN(result) ) return ctx.error( Errors.PARAMETER_NOT_AN_INTEGER, value, this.name );
            return result;
        }

        if( 'boolean' === expectedType ) {
            if( 'string' === typeof value ) {
                const lcValue = value.toLowerCase();
                if('true' === lcValue) return 1;
                if('false' === lcValue) return 0;
            }
            const num = parseInt(value, 10);
            if( isNaN(num) ) return ctx.error( Errors.PARAMETER_NOT_A_BOOLEAN, value, this.name );
            return 0 === num ? 0 : 1;
        }

        if( 'date' === expectedType ) {
            if( null === value ) return null;
            //TODO: support string format (ISO8601, etc.)
            const result = parseInt( value, 10 );
            if( isNaN(result) ) return ctx.error( Errors.PARAMETER_NOT_AN_INTEGER, value, this.name );
            return new Date(result);
        }

        if ( 'array' === expectedType || 'object' === expectedType ) {
            return value;
        }

        return ctx.error( Errors.INTERNAL_ERROR, "unexpected type <" + this.type + " for parameter ' "+ this.name + "'" );
    }

    /**
     *
     */
    fqName() {
        return this.apiName + '.' + this.name;
    }

    /**
     *
     */
    assign( attrs:any ) {
        if( attrs.name ) throw new Error(this.fqName()+ ": should not specify name attribute");

        if( attrs['in'] ) this['in'] = this.checked_in( attrs['in'] );

        if( undefined !== attrs.required ) this.required = this.checked_required( attrs.required );

        if( attrs.type ) this.type = this.checked_type( attrs.type );

        if( attrs.method ) this.method = this.checked_method( attrs.method );

        if( attrs.description ) this.description = attrs.description;

        if( attrs.items ) this.items = attrs.items;
    }

    /*
     * string. see http://swagger.io/specification/#parameterIn
     * The location of the parameter.
     * Now we only support subset of swagger spec: "path", "body".
    */
    checked_in( value:string ) {
        if( typeof value !== 'string' ) throw new Error(this.fqName() + ".in: '" + value + "' is not a string");

        if( value === 'query' ) return value;
        if( value === 'path' ) return value;
        if( value === 'body' ) return value;
        if( value === 'cookie' ) return value;
        if( value === 'internal' ) return value;

        throw new Error(this.fqName() + ".in: '" + value + "' is invalid. Should be: 'path', 'body', 'cookie', 'query', 'internal'. See http://swagger.io/specification/#parameterIn");
    }

    /*
     * boolean.
     * Determines whether this parameter is mandatory.
     * If the parameter is in "path", this property is required and its
     * value MUST be true. Otherwise, the property MAY be included and its
     * default value is false.
     */
    checked_required( value:boolean ) {
        if( typeof value !== 'boolean' ) throw new Error(this.fqName() + ".required: '" + value + "' is not a boolean");

        if( false === value ) {
            if( 'path' === this['in'] ) {
                throw new Error(this.fqName() + ".required: could not be false when in == 'path'");
            }
        }

        return value;
    }

    /** string.
     *
     * If 'in' is not 'body', then the type of the parameter.
     * Required. The type of the parameter. Since the parameter is not
     * located at the request body, it is limited to simple types (that is,
     * not an object). The value MUST be one of "string", "number",
     * "integer", "boolean", "array".
     *
     * Note:
     *      1) For simplicity, we don't support 'file' by swagger. File
     *          should be uploaded then be url.
     *      2) We don't support 'array' yet.
     */
    checked_type( value:string ) {
        if( 'body' === this.in ) throw new Error(this.fqName() + ".type: invalid if in == 'body");
        if( typeof value !== 'string' ) throw new Error(this.fqName() + ".type: '" + value + "' is not a string");

        if( value === 'string' ) return value;
        if( value === 'number' ) return value;
        if( value === 'integer' ) return value;
        if( value === 'boolean' ) return value;
        if( value === 'date' ) return value;
        if( value === 'array' ) return value;
        if( value === 'object' ) return value;

        throw new Error(this.fqName() + ".type: '" + value + "' is invalid. Should be: 'array', 'object', 'date', 'string', 'number', 'integer', 'boolean'");
    }

    checked_method( value:string ) {
        const lcValue = value.toLowerCase();
        if( 'get' === lcValue ) return lcValue;
        if( 'post' === lcValue ) return lcValue;

        throw new Error(this.fqName() + ".method: '" + value + "' is invalid. Should be: 'get', 'post'");
    }

   /**
     *
     */
    /* eslint complexity: ["error", 24] */
    /* eslint 'max-depth': ["error", 6], */
    /* eslint 'max-statements': ["error", 80] */
    static parseAll( apiName:string, prototype:any ) {
        // parse the methods: exec(), auth(), check().
        // the result is [{name, comment}]

        let execRaws:any[];
        if( prototype.exec ) {
            execRaws = ApiParameter.parseMethod(apiName, prototype.exec);
            if( !execRaws.find( (p:any)=>p.name==='ctx' ) ) throw new Error("exec() must have a 'ctx' parameter in api: " + apiName);
        } else {
            throw new Error('missing exec() in api: ' + apiName);
        }

        let authRaws:any[];
        if( prototype.auth ) {
            authRaws = ApiParameter.parseMethod(apiName, prototype.auth);
            if( !authRaws.find( (p:any)=>p.name==='ctx' ) ) throw new Error("auth() must have a 'ctx' parameter in api: " + apiName);
        } else {
            authRaws = [];
        }

        let checkRaws:any[];
        if( prototype.check ) {
            checkRaws = ApiParameter.parseMethod(apiName, prototype.check);
            if( !checkRaws.find( (p:any)=>p.name==='ctx' ) ) throw new Error("check() must have a 'ctx' parameter in api: " + apiName);
        } else {
            checkRaws = [];
        }

        const rawAll:any = {}; // name => {name, comment}

        // merge the parameters by name
        for( let newRaw of execRaws.concat( authRaws, checkRaws ) ) {
            const existing = rawAll[newRaw.name];
            if( !existing ) {
                rawAll[newRaw.name] = newRaw;
            } else {
                const newComment = newRaw.comment;
                if( newComment ) {
                    if( existing.comment ) existing.comment += ',\n' + newComment;
                    else existing.comment = newComment;
                }
            }
        }

        const auths:any[] = [];
        const checks:any[] = [];
        const execs:any[] = [];
        const all:any = {}; // name => ApiParameter
        let method;

        // parse parameter comments
        for( let paramName in rawAll ) {
            if( paramName.startsWith('$') ) throw new Error('param name should not start width $: ' + apiName + '.' + paramName);

            const obj = new ApiParameter(apiName, paramName);

            if( 'ctx' !== paramName ) {
                const raw = rawAll[paramName];

                let json = raw.comment;
                if( json ) {
                    json = '{' + json.trim() + '}';
                    
                    let attrs;
                    try {
                        attrs = eval('(' + json + ')');
                    }catch( err ) {
                        throw new Error( apiName + '.' + paramName + ': ' + err.message + '\n' + json );
                    }

                    if( attrs.method ) {
                        attrs.method = attrs.method.toLowerCase();
                        if( method ) {
                            if( attrs.method !== method ) {
                                throw new Error("only single HTTP method is allowd across all parameters: " + apiName + '.' + paramName);
                            }
                        } else {
                            method = attrs.method;
                        }
                    } else {
                        if ('body' === attrs.in) {
                            method = 'post';
                        }
                    }
                    obj.assign( attrs );
                    if( attrs.in === 'body' ) {
                        obj.type = 'object';
                    }
                    if ('integer' === attrs.type && attrs.format) {
                        // int32, int64
                        obj.format = attrs.format;
                    }
                }
            }

            all[paramName] = obj;
        }

        if( !method ) method = 'get';

        for( let i = 0; i < execRaws.length; i++ ) {
            execs.push( all[execRaws[i].name] );
        }

        for( let i = 0; i < authRaws.length; i++ ) {
            auths.push( all[authRaws[i].name] );
        }

        for( let i = 0; i < checkRaws.length; i++ ) {
            checks.push( all[checkRaws[i].name] );
        }

        return {all, method, auths, checks, execs};
    }

    /**
     *
     */
    /* eslint complexity: ["error", 32] */
    static parseMethod( apiName:string, method:string ) {
        const methodBody = method.toString();

        // first, extract the parameter declaration text
        const decl = methodBody.substring( methodBody.indexOf('('), methodBody.lastIndexOf(')') + 1 ).trim();

        // then, a simple DSM-based parameter parser, it assumes the input declaration text conforms to javascript syntax
        const ST_END = -1, ST_INIT = 0, ST_IN_NAME = 1, ST_IN_CMT = 2;
        let state = ST_INIT;
        const params:any[] = [];
        let param:any;
        let beginOfName = -1, beginOfCmt = -1;
        const length = decl.length;

        for( let i = 0; i < length && state !== ST_END; i++ ) {
            const c = decl[i];

            switch( state ) {

            case ST_INIT: {
                if( '/' === c && '*' === decl[i+1] ) {
                    state = ST_IN_CMT;
                    i += 1;
                    beginOfName = -1;
                    beginOfCmt = i + 1;
                } else if( ')' === c ) {
                    params.push( param );
                    state = ST_END;
                } else if( ',' === c ) {
                    params.push( param );
                    param = null;
                } else if( !(' ' === c || '(' === c || '\t' === c || '\r' === c || '\n' === c || '/' === c) ) {
                    state = ST_IN_NAME;
                    beginOfName = i;
                    beginOfCmt = -1;
                }
            }break;

            case ST_IN_NAME: {
                if( '/' === c ) {
                    if( '/' === decl[i+1] ) throw new Error('Single-line-comment ("//") not supported.\nAPI: ' + apiName + '\n' + decl);
                    if( '*' !== decl[i+1] ) throw new Error('Invalid declaration.\nAPI: ' + apiName + '\n' + decl);
                    if( !param ) param = {};
                    param.name = decl.substring( beginOfName, i );

                    state = ST_IN_CMT;
                    i += 1;
                    beginOfName = -1;
                    beginOfCmt = i + 1;
                } else if( ' ' === c || '\t' === c || '\r' === c || '\n' === c ) {
                    if( !param ) param = {};
                    param.name = decl.substring( beginOfName, i );

                    state = ST_INIT;
                    beginOfName = -1;
                    beginOfCmt = -1;
                } else if( ',' === c || ')' === c ) {
                    if( !param ) param = {};
                    param.name = decl.substring( beginOfName, i );
                    params.push( param );

                    if( ')' === c ) state = ST_END;
                    else {
                        param = null;
                        state = ST_INIT;
                        beginOfName = -1;
                        beginOfCmt = -1;
                    }
                }
            }break;

            case ST_IN_CMT: {
                if( '*' === c && '/' === decl[i+1] ) {
                    if( !param ) param = {};
                    if( param.comment ) {
                        throw new Error('Multi-comments not suported.\nAPI: ' + apiName + '\n' + decl);
                    }
                    param.comment = decl.substring( beginOfCmt, i );

                    i += 1;
                    state = ST_INIT;
                    beginOfName = -1;
                    beginOfCmt = -1;
                }
            }break;

            default:break;
            }
        }

        return params;
    }

}
