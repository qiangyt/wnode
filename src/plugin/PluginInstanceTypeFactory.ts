import MongooseTypeFactory = require('../graphql/MongooseTypeFactory');


export default class PluginInstanceTypeFactory extends MongooseTypeFactory {

    constructor( provider ) {
        super(provider);
        this.$id = 'PluginInstanceTypeFactory';
    }

}

