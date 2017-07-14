'use strict';

const Logger = require('../Logger');
const g = require('graphql');
const _ = require('lodash');
const CodePath = require('../util/CodePath');
const ComponentBuilder = require('./ComponentBuilder');


class GraphQLEngine {


    constructor( id, manifestDir ) {
        this.manifestDir = manifestDir || CodePath.resolve('manifest');

        this.$id = id;
        this.logger = Logger.create(id);
        this.inited = false;
        this.$GraphQLAliSearchJobQueue = null;

        this.$lazy = true;
        this.$init = 'init';
    }


    init() {
        if( this.inited ) throw new Error('already initialized');
        this.logger.info('initializing with factories');

        const providers = this._buildProviders(this.manifestDir);

        this.providers = {};
        providers.forEach( p => {
            const id = p.id();
            if( this.providers[id] ) throw new Error(`duplicated provider with id=${id}`);
            this.providers[id] = p; 
        } );

        const factories = providers.map( p => p.typeFactory() );
        
        //this._defineEnumTypes(factories);
        this._defineObjectTypes(factories);
        this._defineInputTypes(factories);

        this.schema = new g.GraphQLSchema( {
            query: this._defineRootQueries(factories),
            mutation: this._defineRootMutations(factories)
        } );

        this.manifestProvider.flush();

        const schemaLog = g.printSchema(this.schema);
        //console.log(schemaLog);
        this.logger.info( {schema: schemaLog}, 'schema' );
    }


    componentBuilder() {
        let r = this._componentBuilder;
        if( !r ) this._componentBuilder = r = this._createComponentBuilder();
        return r;
    }


    _createComponentBuilder() {
        return new ComponentBuilder(this);
    }


    _buildProviderWithManifest( manifest ) {
        this.manifestProvider.insertManifest(manifest);

        const type = manifest.implementation.type;

        if( type === 'mongoose' ) {
            return this.componentBuilder().buildMongooseProvider(manifest);
        }

        throw new Error(`unsupported implementation type: ${manifest}` );
    }


    _buildProvidersWithManifestDir( manifestDir ) {
        const manifests = this._loadManifestFiles(manifestDir);
        return manifests.map( manifest => this._buildProviderWithManifest(manifest) );
    }


    _buildExternalProviders( manifestDir ) {
        return this._buildProvidersWithManifestDir(manifestDir);
    }


    _loadManifestFiles( manifestDir ) {
        return this.manifestProvider.loadManifestFiles(manifestDir);
    }
    

    _buildInternalProviders( manifestDir ) {
        this.manifestProvider = this.componentBuilder().buildManifestProvider(manifestDir);
        return [this.manifestProvider];
    }


    _buildProviders( manifestDir ) {
        const internals = this._buildInternalProviders(manifestDir);
        const externals = this._buildExternalProviders(manifestDir);
        return internals.concat(externals);
    }


    /*_defineObjectType_Sorter() {
        return new g.GraphQLObjectType({
            name: 'Sorter',
            fields: {
                sortField: {
                    type: g.GraphQLString
                },
                sortDirection: {
                    type: g.GraphQLString
                }
            }
        });
    }*/


    _defineBuiltInObjectTypes() {
        //this.objectType_Sorter = this._defineObjectType_Sorter();
        //return [this.objectType_Sorter];
        return [];
    }


    _defineObjectTypes( factories ) {
        this.objectTypes = {};

        this._defineBuiltInObjectTypes();

        for( let factory of factories ) {
            if( !factory.defineObjectTypes ) continue;
            factory.defineObjectTypes(this);
        }
    }


    addObjectType( type ) {
        const name = type.name;
        if( name === 'Query' ) throw new Error('object type name SHOULD NOT be "Query"');
        if( name === 'Mutation' ) throw new Error('object type name SHOULD NOT be "Mutation"');

        const existing = this.objectTypes[name];
        if( existing ) throw new Error(`object type ${name} is duplicated`);

        this.objectTypes[name] = type;
    }

    
    lookupObjectType( typeName ) {
        const r = this.objectTypes[typeName];
        if( !r ) throw new Error(`object type not found: ${typeName}`);
        return r;
    }


    _defineBuiltInInputTypes() {
        return [];
    }


    _defineInputTypes( factories ) {
        this.inputTypes = {};

        const builtInInputTypes = this._defineBuiltInInputTypes();
        this._addInputTypes(builtInInputTypes);

        for( let factory of factories ) {
            if( !factory.defineInputTypes ) continue;
            this._addInputTypes(factory.defineInputTypes(this));
        }
    }


    _addInputTypes( types ) {
        for( let type of types ) {
            const name = type.name;

            const existing = this.inputTypes[name];
            if( existing ) throw new Error(`input type ${name} is duplicated`);

            this.inputTypes[name] = type;
        }
    }

    
    lookupInputType( typeName ) {
        const r = this.inputTypes[typeName];
        if( !r ) throw new Error(`input type not found: ${typeName}`);
        return r;
    }


    _defineBuiltInEnumTypes() {
        return [];
    }


    _defineEnumTypes( factories ) {
        this.enumTypes = {};

        const builtInEnumTypes = this._defineBuiltInEnumTypes();
        this._addEnumTypes(builtInEnumTypes);

        for( let factory of factories ) {
            if( !factory.defineEnumTypes ) continue;
            this._addEnumTypes(factory.defineEnumTypes(this));
        }
    }


    _addEnumTypes( types ) {
        for( let type of types ) {
            const name = type.name;

            const existing = this.enumTypes[name];
            if( existing ) throw new Error(`enum type ${name} is duplicated`);

            this.enumTypes[name] = type;
        }
    }

    
    lookupEnumType( typeName ) {
        const r = this.enumTypes[typeName];
        if( !r ) throw new Error(`enum type not found: ${typeName}`);
        return r;
    }


    _defineRootQueries( factories ) {
        const methods = {};

        for( let factory of factories ) {
            if( !factory.defineQueries ) continue;

            for( let method of factory.defineQueries(this) ) {
                const name = method.name;

                const existing = methods[name];
                if( existing ) throw new Error(`query ${name} is duplicated`);
                
                methods[name] = method;
            }
        }

        return _.isEmpty(methods) ? undefined : new g.GraphQLObjectType( {name: 'Query', fields: methods} );
    }


    _defineRootMutations( factories ) {
        const methods = {};

        for( let factory of factories ) {
            if( !factory.defineMutations ) continue;

            for( let method of factory.defineMutations(this) ) {
                const name = method.name;

                const existing = methods[name];
                if( existing ) throw new Error(`mutation ${name} is duplicated`);
                
                methods[name] = method;
            }
        }

        return _.isEmpty(methods) ? undefined : new g.GraphQLObjectType( {name: 'Mutation', fields: methods} );
    }
    

    execute( ctx, query, variables, operationName ) {
        return g.graphql( this.schema, query, undefined/*TODO: this.rootValue*/, ctx, variables, operationName )
        .then( result => {
            const errs = result.errors;
            if( errs && errs.length ) {
                const originalError = errs[0].originalError;
                if( originalError && global.config.server.printStackTraceAlways ) {
                    this.logger.error( {err:originalError, ctx}, originalError.message );
                }
            }
            return result;
        } );
    }


    getManifest( manifestId ) {
        return this.manifestProvider.getManifest(manifestId);
    }


}


module.exports = GraphQLEngine;
