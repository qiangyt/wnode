'use strict';

const ManifestProvider = require('./ManifestProvider');
const MongooseProvider = require('./MongooseProvider');
const GraphQLMongooseDao = require('./GraphQLMongooseDao');
const AliSearchHelper = require('./AliSearchHelper');


class ComponentBuilder {


    constructor( engine ) {
        this.engine = engine;
    }


    buildJobQueue() {
        //return global.bearcat.getBean('ToyJobQueue');
        return global.bearcat.getBean('GraphQLAliSearchJobQueue');
    }


    buildSearchHelper( manifest ) {
        const r = new AliSearchHelper(); 
        r.engine = this.engine;
        r.manifest = manifest;
        r.init();
        return r;
    }


    buildManifestProvider( manifestDir ) {
        const r = new ManifestProvider();
        r.engine = this.engine;
        r.manifestDir = manifestDir;
        r.init();
        return r;
    }


    buildMongooseProvider( manifest ) {
        const dao = this._resolveMongooseDao(manifest);

        return this._resolveMongooseProvider( manifest, dao );
    }


    _resolveMongooseProvider( manifest, dao ) {
        const options = manifest.implementation.options || {};
        const fileName = manifest.fileName;
        let r;

        const beanName = options.provider;
        if( !beanName ) {
            r = this._createMongooseProvider(dao);
        } else {
            r = global.bearcat.getBean(beanName);
            if( !r ) throw new Error(`${fileName}: bean "${beanName}" NOT found`);
            if( !(r instanceof MongooseProvider) ) throw new Error(`${fileName}: bean "${beanName}" is NOT a MongooseProvider`);

            if( r.dao && dao ) {
                if( r.dao === dao ) throw new Error(`${fileName}: bean has "dao" property ALREADY assigned, so shouldn't specify another dao bean via manifest.implementation.options.dao`);
            } else if( !r.dao ) {
                if( !dao ) throw new Error(`${fileName}: bean "${beanName}" has NO "dao" property assigned`);
                r.dao = dao;
            }
        }

        r.manifest = manifest;
            
        return r;
    }


    _createMongooseProvider( dao ) {
        const r = new MongooseProvider();
        r.engine = this.engine;
        r.dao = dao;
        r.init();
        return r;
    }


    _resolveMongooseDao( manifest ) {
        const options = manifest.implementation.options || {};

        let r = null;

        const beanName = options.dao;
        if( beanName ) {
            r = global.bearcat.getBean(beanName);
            if( !r ) throw new Error(`${manifest.fileName}: bean "${beanName}" NOT found`);
            if( !r.manifest ) r.manifest = manifest;
            if( !r.engine ) r.engine = this.engine;
        } else if( options.schema ) {
            r = this._createMongooseDao( options, manifest );
        }

        return r;
    }


    _createMongooseDao( options, manifest ) {
        const r = new GraphQLMongooseDao( options.schema, options.instance );
        r.engine = this.engine;
        r.manifest = manifest;
        r.init();
        return r;
    }


    buildAliOpenSearch() {
        return global.bearcat.getBean('AliOpenSearch');
    }


}


module.exports = ComponentBuilder;
