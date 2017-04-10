


declare module global {
    const bearcat:any;
}

const beansToRegister:any[] = [];

export default {

    requireAsBean: function requireAsBean( mod:any, name:string ) {
        const r = mod.require(name);
        beansToRegister.push( r );
        return r;
    },

    initBeans: function initBeans() {
        beansToRegister.forEach( bean => global.bearcat.module(bean) );
    }

};
