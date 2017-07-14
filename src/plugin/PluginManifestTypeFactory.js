'use strict';

const ManifestTypeFactory = require('../graphql/ManifestTypeFactory');
const g = require('graphql');
const PluginScope = require('./PluginScope');


//TODO: convert the error to GraphQL error
class PluginManifestTypeFactory extends ManifestTypeFactory {


    _defineObjectType_Manifest( engine, groupType, fieldType ) {
        const r = super._defineObjectType_Manifest( engine, groupType, fieldType );

        r.fields.scopes = {
            type: new g.GraphQLList(engine.lookupObjectType(PluginScope.name)),
            resolve: manifest => manifest.scopes
        };

        return r;
    }


    _defineEnum_PluginScope() {
        return {
            name: PluginScope.name,
            values: {
                SYSTEM: {
                    value: PluginScope.SYSTEM, 
                    description: '系统'
                },
                PROGRAM: {
                    value: PluginScope.PROGRAM, 
                    description: '节目'
                }
            }
        };
    }


    /** @override */
    defineObjectTypes( engine ) {
        const type_PluginScope = new g.GraphQLEnumType(this._defineEnum_PluginScope());
        engine.addObjectType(type_PluginScope);

        super.defineObjectTypes(engine);
    }

}


module.exports = PluginManifestTypeFactory;
