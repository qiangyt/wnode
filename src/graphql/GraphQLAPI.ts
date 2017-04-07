import Errors = require('../Errors');
import Exception = require('../Exception');
import BaseAPI = require('./BaseAPI');


/**
 *
 */
export default class GraphQLAPI extends BaseAPI {

    constructor() {
        super('GraphQLAPI');
    }


    /** @override */
    _exec( engine, ctx, query, variables, operationName ) {
    
        return engine.execute( ctx, query, variables, operationName )
        .then( result => {
            const errs = result.errors;
            if( errs && errs.length ) throw new Exception( Errors.GRAPHQL_EXECUTION_FAILURE, errs );
            return result.data;//TODO: following the graphql response spec
        } );

    }

}

Object.assign( GraphQLAPI, {
    apiName: 'graphql',
    summary: 'graphql'
} );

