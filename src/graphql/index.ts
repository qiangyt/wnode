import requireAsBean = require('../Internal').requireAsBean;


export default {

    AliSearchHelper:            require('./AliSearchHelper'),

    GraphQLAliSearchJobQueue:   requireAsBean( module, './GraphQLAliSearchJobQueue' ),

    BaseAPI:                    require('./BaseAPI'),

    ComponentBuilder:           require('./ComponentBuilder'),

    GraphQLMongooseDao:         require('./GraphQLMongooseDao'),
    
    InputCategory:              require('./InputCategory'),

    ManifestProvider:           require('./ManifestProvider'),
    ManifestTypeFactory:        require('./ManifestTypeFactory'),

    MongooseProvider:           require('./MongooseProvider'),
    MongooseTypeFactory:        require('./MongooseTypeFactory'),

    Provider:                   require('./Provider'),

    TypeFactory:                require('./TypeFactory'),

    module: module

};
