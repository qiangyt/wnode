const fury = require('fury');
fury.use(require('fury-adapter-apib-serializer'));
fury.use(require('fury-adapter-swagger'));

import SwaggerHelper from '../swagger/SwaggerHelper';

//hint: use MWeb Lite to view blueprint

/**
 *
 */
export default class BlueprintHelper {

    public $id = 'BlueprintHelper';
    public $SwaggerHelper:SwaggerHelper = null;

    /**
     * 
     */
    output( server, apiName:string, options:any, callback ) {
        const swagger = this.$SwaggerHelper.root( server, apiName, options );
        const swaggerJson = JSON.stringify(swagger);

        fury.parse( {source: swaggerJson}, function (err, response) {
            if (err) return callback( err, null );

            fury.serialize( {api: response.api}, function (err, blueprint) {
                if (err) return callback( err, null );
                callback( null, blueprint );
            } );
        });
    }

}

