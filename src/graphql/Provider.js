'use strict';


/* eslint no-unused-vars:"off" */


class Provider {

    constructor() {
        this.$init = 'init';
        this.$lazy = true;
    }


    init() {
        // do nothing
    }


    /** @override */
    id() {
        return this.manifest.id;
    }


    /** @override */
    typeFactory() {
        throw new Error('implementation required');
    }


    auth( ctx, typeName, opName, source, args ) {
        return Promise.resolve();
    }

}


module.exports = Provider;
