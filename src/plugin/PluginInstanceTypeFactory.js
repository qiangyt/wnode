'use strict';

const MongooseTypeFactory = require('../graphql/MongooseTypeFactory');


class PluginInstanceTypeFactory extends MongooseTypeFactory {

    constructor( provider ) {
        super(provider);
        this.$id = 'PluginInstanceTypeFactory';
    }

}


module.exports = PluginInstanceTypeFactory;
