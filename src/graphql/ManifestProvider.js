'use strict';

const ManifestTypeFactory = require('./ManifestTypeFactory');
const Fs = require('fs');
const Path = require('path');
const _ = require('lodash');
const Provider = require('./Provider');


/* eslint no-unused-vars: 'off' */


class ManifestProvider extends Provider {


    /** @override */
    init() {
        super.init();

        this.groups = [];
        this.list = [];
        this.mapById = {};
        this.mapByLabel = {};
    }

    
    /** @override */
    id() {
        return 'manifest';
    }


    /** @override */
    typeFactory() {
        return new ManifestTypeFactory(this);
    }


    flush() {
        this.list.forEach( manifest => {
            manifest.fields = _.sortBy( manifest.fields, [f => f.order] );
        } );
    }


    insertManifest( manifest ) {
        const id = manifest.id;
        
        if( this.mapById[id] ) throw new Error(`${id} is duplicated`);
        
        const label = manifest.label;
        if( this.mapByLabel[label] ) throw new Error(`${label} is duplicated`);
        
        manifest.fields = manifest.fields || [];
        manifest.fieldsByName = {};
        manifest.searchableFields = {};

        manifest.addField = function( field ) {
            manifest.fields.push(field);

            const fieldName = field.name;
            manifest.fieldsByName[fieldName] = field;
            if( field.searchable ) {
                manifest.searchableFields[fieldName] = field;
                manifest.searchable = true;
            }
        };
        
        this.mapById[id] = manifest;
        this.mapByLabel[label] = manifest;
        this.list.push(manifest);

        const g = this.resolveGroup(manifest.groupId);
        manifest.group = g;

        g.manifests[id] = manifest;
        g.manifestList.push(manifest);
    }
    

    getManifest( id ) {
        return this.mapById[id];
    }


    getGroup( id ) {
        for( const r of this.groups ) {
            if( r.id === id ) return r;
        }
        return null;
    } 


    resolveGroup( id ) {
        let r = this.getGroup(id);
        if( !r ) {
            r = {id, manifests:{}, manifestList:[]};
            this.groups.push(r);
        }
        return r;
    }


    hasOneGroup() {
        return this.groups.length > 0;
    }


    hasOneManifest() {
        return this.hasOneGroup();
    }


    listAllManifest() {
        return this.list;
    }


    listAllGroup() {
        return this.groups;
    }


    listManifest( idArray ) {
        return idArray.map( id => this.getManifest(id) );
    }


    listGroup( idArray ) {
        return idArray.map( id => this.getGroup(id) );
    }


    _normalizeManifestFile( path, id, manifest ) {
        if( !manifest.label ) throw new Error(`${path.base}: label property is NOT specified: "label"`);
        if( !manifest.description ) manifest.description = manifest.label;
        if( !manifest.groupId ) manifest.groupId = 'default';

        if( !manifest.maxLimit ) manifest.maxLimit = 20;

        let impl = manifest.implementation;
        if( !impl ) impl = manifest.implementation = {}
        if( !impl.type ) impl.type = 'mongoose';

        let options = impl.options;
        if( !options ) options = impl.options = {}
        if( !options.schema ) options.schema = id;
        
    }


    loadManifestFile( path, id ) {
        if( !path.ext === '.manifest.js' && !path.ext !== '.manifest.json' ) return null;
        
        const stat = Fs.statSync(path.full);
        if( stat.isDirectory() ) return null; // 跳过目录

        id = id || path.name.substring( 0, path.name.length - '.manifest'.length);
        return this.loadManifest( path, id );
    }


    loadManifest( path, id ) {
        /* eslint global-require: 'off' */
        const r = require(path.full);

        this._normalizeManifestFile( path, id, r );

        r.fileName = path.base;
        r.id = id;

        return r;
    }

    
    loadManifestFiles( dir ) {
        const r = [];

        /*eslint no-sync: "off"*/
        for( const fileName of Fs.readdirSync(dir) ) {
            const path = Path.parse(Path.join( dir, fileName ));

            const manifest = this.loadManifestFile(path);
            if( !manifest ) continue;
            r.push(manifest);
        }

        return r;
    }

}


module.exports = ManifestProvider;
