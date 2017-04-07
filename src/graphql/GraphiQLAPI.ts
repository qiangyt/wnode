import BaseAPI = require('./BaseAPI');


/**
 *
 */
export default class GraphiQLAPI extends BaseAPI {

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

