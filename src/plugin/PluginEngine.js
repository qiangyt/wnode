'use strict';

const GraphQLEngine = require('../graphql/GraphQLEngine');
const PluginComponentBuilder = require('./PluginComponentBuilder');
const Path = require('path');


class PluginEngine extends GraphQLEngine {


    constructor() {
        super('PluginEngine');
    }


    /** @override */
    _createComponentBuilder() {
        return new PluginComponentBuilder(this);
    }


    _buildPluginInstanceProvider() {
        const id = 'PluginInstance';
        const manifestPath = Path.parse(Path.join(Path.dirname(module.filename), `${id}.manifest.json`));
        const manifest = this.manifestProvider.loadManifest(manifestPath, id);
        return this._buildProviderWithManifest(manifest);
    }


    /** @override */
    _buildInternalProviders( manifestDir ) {
        const r = super._buildInternalProviders(manifestDir);
        r.push(this._buildPluginInstanceProvider());
        return r;
    }

}


module.exports = PluginEngine;
