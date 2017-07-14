'use strict';

const MongooseProvider = require('../graphql/MongooseProvider');
const PluginInstanceTypeFactory = require('./PluginInstanceTypeFactory');


class PluginInstanceProvider extends MongooseProvider {

    constructor() {
        super();
        this.$id = 'PluginInstanceProvider';
    }


    typeFactory() {
        return new PluginInstanceTypeFactory(this);
    }

}


module.exports = PluginInstanceProvider;
