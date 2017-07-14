'use strict';


const AliSearchJobQueue = require('../job').AliSearchJobQueue;


class GraphQLAliSearchJobQueue extends AliSearchJobQueue {
    

    constructor() {
        super('GraphQLAliSearchJobQueue');
    }


    init() {
        global.config.job = global.config.job || {};
        this.config = global.config.job.GraphQLAliSearchJobQueue = global.config.job.GraphQLAliSearchJobQueue || {};
        
        this._init( this.config, 'GraphQLAliSearchJobQueue' );
    }

}


module.exports = GraphQLAliSearchJobQueue;
