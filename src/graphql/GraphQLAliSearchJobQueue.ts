import AliSearchJobQueue = require('../job/AliSearchJobQueue');


export default class GraphQLAliSearchJobQueue extends AliSearchJobQueue {
    

    constructor() {
        super('GraphQLAliSearchJobQueue');
    }


    init() {
        global.config.job = global.config.job || {};
        this.config = global.config.job.GraphQLAliSearchJobQueue = global.config.job.GraphQLAliSearchJobQueue || {};
        
        this._init( this.config, 'GraphQLAliSearchJobQueue' );
    }

}

