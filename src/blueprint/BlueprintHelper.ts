const fury = require('fury');
fury.use(require('fury-adapter-apib-serializer'));
fury.use(require('fury-adapter-swagger'));


//hint: use MWeb Lite to view blueprint

/**
 *
 */
export default class BlueprintHelper {

    constructor() {
        this.$id = 'BlueprintHelper';
        this.$SwaggerHelper = null;
    }

    /**
     * 
     */
    output( server, apiName, options, callback ) {
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

