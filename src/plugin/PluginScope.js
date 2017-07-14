'use strict';

const Util = require('util');


const PROGRAM = 'PROGRAM';
const SYSTEM = 'SYSTEM';

const DEFAULT = SYSTEM;
const DEFAULTS = [DEFAULT];

const name = 'PluginScope';


function validate( scope ) {
    if( scope === PROGRAM ) return scope;
    if( scope === SYSTEM ) return scope;
    
    throw new Error(`unsupported plugin scope: ${scope}`);
}


function normalize( scopeOrScopeArray ) {
    if( !scopeOrScopeArray ) return DEFAULTS;

    if( Util.isArray(scopeOrScopeArray) ) {
        if( !scopeOrScopeArray.length ) return DEFAULTS;

        scopeOrScopeArray.forEach( scope => validate(scope) );
        return scopeOrScopeArray;
    }

    const scope = scopeOrScopeArray;
    validate(scope);

    return [scope];
}


module.exports = {

    name,
    
    PROGRAM,
    SYSTEM,

    DEFAULT,
    DEFAULTS,

    validate,
    normalize

};
