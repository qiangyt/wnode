'use strict';

const ComponentBuilder = require('../graphql/ComponentBuilder');
const PluginManifestProvider = require('./PluginManifestProvider');
const PluginSearchHelper = require('./PluginSearchHelper');


class PluginComponentBuilder extends ComponentBuilder {


    constructor( engine ) {
        super(engine);
        this.engine = engine;
    }


    /** @override */
    buildManifestProvider( manifestDir ) {
        const r = new PluginManifestProvider(manifestDir);
        r.engine = this.engine;
        r.manifestDir = manifestDir;
        r.init();
        return r;
    }


    /** @override */
    buildSearchHelper( manifest ) {
        const r = new PluginSearchHelper();
        r.engine = this.engine;
        r.manifest = manifest;
        r.init();
        return r;
    }

}


module.exports = PluginComponentBuilder;
