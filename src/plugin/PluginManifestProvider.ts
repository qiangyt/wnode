import ManifestProvider = require('../graphql/ManifestProvider');
import PluginManifestTypeFactory = require('./PluginManifestTypeFactory');
import PluginScope = require('./PluginScope');


export default class PluginManifestProvider extends ManifestProvider {
    
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

