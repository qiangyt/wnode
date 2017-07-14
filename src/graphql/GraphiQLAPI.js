'use strict';

const BaseAPI = require('./BaseAPI');


/**
 *
 */
class GraphiQLAPI extends BaseAPI {

    constructor() {
        super('GraphiQLAPI');
    }


    /** @override */
    _exec( engine, ctx, query, variables, operationName ) {
    
        return engine.execute( ctx, query, variables, operationName );

    }

}


Object.assign( GraphiQLAPI, {
    apiName: 'graphiql',
    summary: 'graphiql',
    customizeJsonResponse: true
} );

module.exports = GraphiQLAPI;
