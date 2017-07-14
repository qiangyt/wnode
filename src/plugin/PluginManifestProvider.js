'use strict';

const ManifestProvider = require('../graphql/ManifestProvider');
const PluginManifestTypeFactory = require('./PluginManifestTypeFactory');
const PluginScope = require('./PluginScope');


class PluginManifestProvider extends ManifestProvider {
    
    /** @override */
    typeFactory() {
        return new PluginManifestTypeFactory(this);
    }


    /** @override */
    insertManifest( manifest ) {
        if( manifest.groupId === 'plugin' ) {
            manifest.scopes = PluginScope.normalize(manifest.scopes);
        }

        super.insertManifest(manifest);
    }

}


module.exports = PluginManifestProvider;
