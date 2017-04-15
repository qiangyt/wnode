


declare module global {
    const bearcat:any;
}

const beansToRegister:any[] = [];

export function requireAsBean( mod:NodeModule, name:string ) {
    const r = mod.require(name);
    beansToRegister.push( r );
    return r;
}


export function initBeans() {
    beansToRegister.forEach( bean => global.bearcat.module(bean) );
}

export function registerAsBean( bean:any ) {
    beansToRegister.push( bean );
}