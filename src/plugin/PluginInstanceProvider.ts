import MongooseProvider = require('../graphql/MongooseProvider');
import PluginInstanceTypeFactory = require('./PluginInstanceTypeFactory');


export default class PluginInstanceProvider extends MongooseProvider {

    constructor() {
        super();
        this.$id = 'PluginInstanceProvider';
    }


    typeFactory() {
        return new PluginInstanceTypeFactory(this);
    }

}
