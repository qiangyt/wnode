'use strict';

/* eslint no-unused-vars:'off' */

const DataLoader = require('dataloader');
const TypeFactory = require('./TypeFactory');
const g = require('graphql');
const GraphQLObjectType = g.GraphQLObjectType;
const GraphQLList = g.GraphQLList;
const GraphQLString = g.GraphQLString;
const GraphQLBoolean = g.GraphQLBoolean;
const GraphQLNonNull = g.GraphQLNonNull;
const GraphQLInt = g.GraphQLInt;
const InputCategory = require('./InputCategory');

const _ = require('lodash');


//TODO: convert the error to GraphQL error
class MongooseTypeFactory extends TypeFactory {


    static mapMongooseNumberType( name, fieldName, mongooseField ) {
        const fmt = mongooseField.format;
        if( !fmt ) throw new Error(`${name}.${fieldName}: Number field MUST specify 'format' property`);
            
        if( fmt === 'int32' || fmt === 'int64' || fmt === 'int' ) {
            return g.GraphQLInt;
        }
        if( fmt === 'float' || fmt === 'double' ) {
            return g.GraphQLFloat;
        }

        throw new Error(`${name}.${fieldName}: unknown number format. The available: int, float`);
    }


    static mapMongooseTypeToGraphQLType( engine, name, fieldName, mongooseField ) {
        const type = mongooseField.type;

        if( type === String ) return g.GraphQLString;
        
        if( type === Number ) {
            return MongooseTypeFactory.mapMongooseNumberType( name, fieldName, mongooseField );           
        }

        if( type === Boolean ) return g.GraphQLBoolean;
        
        if( type === Date ) return engine.lookupObjectType(TypeFactory.DATETIME);

        throw new Error(`${name}.${fieldName}: unknown number format: ${type}. The available: int, float`);
    }


    _mapGraphQLTypeToInputCategory( name, engine, fieldName, type ) {
        const typeName = type.name;

        if( typeName === 'String' ) return InputCategory.SHORT_TEXT;
        if( typeName === 'Int' ) return InputCategory.INT;
        if( typeName === 'Float' ) return InputCategory.FLOAT;
        if( typeName === 'Boolean' ) return InputCategory.BOOLEAN;
        if( typeName === 'DateTime' ) return InputCategory.DATETIME;

        throw new Error(`${name}.${fieldName}: unknown graphql type: ${type}`);
    }


    _defineField( name, engine, order, fieldName, mongooseField ) {

        const manifest = {
            label: fieldName,
            order: order,
            sortable: false,
            filterable: false,
            searchable: false
        };
        if( mongooseField.manifest ) {
            _.merge( manifest, mongooseField.manifest );
        }

        if( manifest.filterable && manifest.searchable ) {
            throw new Error(`${name}.${fieldName}: CANNOT be both filterable and searchable`);
        }

        let type;
        if( manifest.type ) {
            type = engine.lookupObjectType(manifest.type);
        } else {
            type = MongooseTypeFactory.mapMongooseTypeToGraphQLType( engine, name, fieldName, mongooseField );
        }

        manifest.inputCategory = this._mapGraphQLTypeToInputCategory( name, engine, fieldName, type );
    
        return {
            type,
            //resolve( document, args, ctx ) {
            resolve: document => document[fieldName],
            manifest
        };
    }



    _normalizeField( fieldName, mongooseField ) {
        if( fieldName === 'search' ) throw new Error('field name CANNOT be "search"');

        const type = typeof mongooseField;
        if( type === 'object' ) return mongooseField;

        if( mongooseField === String ) return {type: String};

        throw new Error('unsupported mongoose field type: ' + mongooseField);
    }


    _enhanceIdFieldOfDataObjectType( idField ) {
        Object.assign( idField.manifest, {
            sortable: true,
            filterable: true
        } );
    }


    _resolveIdField( name, engine, fields ) {
        let r = fields['_id'];

        if( !r ) {
            let orderMinimal = 0;
            for( const fieldName in fields ) {
                const field = fields[fieldName];
                if( field.manifest && field.manifest.order < orderMinimal ) {
                    orderMinimal = field.manifest.order;
                }
            }
            const mField = this._normalizeField( '_id', {type:String, manifest:{label:'#'}} );
            fields['_id'] = r = this._defineField( name, engine, orderMinimal, '_id', mField );
        }

        this._enhanceIdFieldOfDataObjectType(r);

        return r;
    }


    _defineObjectType_output( engine ) {
    
        const provider = this.provider;
        const mObj = provider.mongooseSchema().obj;
        const fields = {};
        const name = provider.mongooseSchemaName();

        let order = 1;
        for( const fieldName in mObj ) {
            const mField = this._normalizeField( fieldName, mObj[fieldName] );
            fields[fieldName] = this._defineField( name, engine, order, fieldName, mField );

            order++;
        }

        this._resolveIdField( name, engine, fields );

        for( const fieldName in fields ) {
            const graphqlField = fields[fieldName];
            const graphqlFieldManifest = graphqlField.manifest;
            const manifestField = {};
            for( const fieldManifestName in graphqlFieldManifest ) {
                manifestField[fieldManifestName] = graphqlFieldManifest[fieldManifestName];
            }
            manifestField.name = fieldName;
            provider.manifest.addField(manifestField);
        }

        return {
            name,
            createLoader( ctx ) {
                return new DataLoader( idArray => provider.list( ctx, idArray ) );
            },
            fields
        };
    }


    _defineObjectTypes_page( engine, outputType ) {

        return {
            name: this.provider.mongooseSchemaName() + 'Page',
            fields: {
                total: {
                    type: g.GraphQLInt,
                    resolve: page => page.total
                },
                offset: {
                    type: g.GraphQLInt,
                    resolve: page => page.offset
                },
                limit: {
                    type: g.GraphQLInt,
                    resolve: page => page.limit
                },
                rows: {
                    type: new g.GraphQLList(outputType),
                    resolve: page => page.rows
                }
            }
        };
    }


    /** @override */
    defineObjectTypes( engine ) {

        const outputType = new GraphQLObjectType(this._defineObjectType_output(engine));
        engine.addObjectType(outputType);

        const pageType = new GraphQLObjectType(this._defineObjectTypes_page( engine, outputType ));
        engine.addObjectType(pageType);

        outputType.pageType = pageType;
    }


    static buildFilterInputTypeName( typeName ) {
        return `${typeName}Filter`;
    }


    _defineInputType_filter( engine ) {
        const typeName = this.provider.mongooseSchemaName();

        const type = engine.lookupObjectType(typeName);
        let filterableFields;
        const fields = type._typeConfig.fields;
        for( let fieldName in fields ) {
            const f = fields[fieldName];
            if( !f.manifest.filterable ) continue;

            if( !filterableFields ) filterableFields = {}; 
            filterableFields[fieldName] = {type: f.type};
        }
        
        if( !filterableFields ) return null;

        return {
            name: MongooseTypeFactory.buildFilterInputTypeName(typeName),
            fields: filterableFields
        };
    }


    static buildInputDataTypeName( typeName ) {
        return `${typeName}Data`;
    }
    

    _defineInputType_input( engine ) {
    
        const provider = this.provider;
        const mObj = provider.mongooseSchema().obj;
        const fields = {};
        const name = provider.mongooseSchemaName();

        for( const fieldName in mObj ) {
            const mField = this._normalizeField( fieldName, mObj[fieldName] );

            const manifest = {};
            if( mField.manifest ) {
                _.merge( manifest, mField.manifest );
            }

            let type;
            if( manifest.type ) {
                type = engine.lookupObjectType(manifest.type);
            } else {
                type = MongooseTypeFactory.mapMongooseTypeToGraphQLType( engine, name, fieldName, mField );
            }
            
            fields[fieldName] = {type};
        }

        delete fields._id;

        return {
            name: MongooseTypeFactory.buildInputDataTypeName(name),
            fields
        };
    }


    /** @override */
    defineInputTypes( engine ) {
        const r = [];

        const inputType_filter = new g.GraphQLInputObjectType(this._defineInputType_filter(engine));
        if( inputType_filter ) r.push(inputType_filter);

        const inputType_input = new g.GraphQLInputObjectType(this._defineInputType_input(engine));
        if( inputType_input ) r.push(inputType_input);

        return r;
    }


    _defineQuery_query( engine ) {
        const provider = this.provider;
        const typeName = provider.mongooseSchemaName();
        const type = engine.lookupObjectType(typeName);
        const filterType = engine.lookupInputType(MongooseTypeFactory.buildFilterInputTypeName(typeName));
        
        const argDefinitions = {
            offset: {type: g.GraphQLInt, defaultValue:0},
            limit: {type: g.GraphQLInt, defaultValue:20},
            sortField: {type: g.GraphQLString},
            sortDirection: {type: g.GraphQLString},
            filter: {type: filterType}
        };

        if( provider.manifest.searchable ) argDefinitions.word = {type: g.GraphQLString};

        return {
            name: type.name + '_query',
            type: type.pageType,
            args: argDefinitions,
            resolve: ( sourceValue, args, ctx ) => {
                return provider.query( ctx, args.offset, args.limit, args.sortField, args.sortDirection, args.filter, args.word )
                    .then( page => {
                        if( page.rows.length > 0 ) {
                            const loader = ctx.resolveLoader(type);
                            page.rows = loader.loadMany(page.rows);
                        }
                        return page;
                    } );
            }
        };
    }


    /** @override */
    defineQueries( engine ) {
        const typeName = this.provider.mongooseSchemaName();

        const r = super._defineQueries( engine, typeName );

        r.push( this._defineQuery_query(engine) );

        return r;
    }


    /** @override */
    defineMutations( engine ) {
        const typeName = this.provider.mongooseSchemaName();
        const type = engine.lookupObjectType(typeName);

        const r = [];
        r.push( this._defineMutation_removeById( engine, type ) );
        r.push( this._defineMutation_insert( engine, type ) );
        r.push( this._defineMutation_update( engine, type ) );
        
        return r;
    }


    _defineMutation_removeById( engine, type, idType ) {
        const provider = this.provider;
        
        return {
            name: type.name + '_removeById',
            type: engine.lookupObjectType('MutationResult'),//idType ? idType : GraphQLString,
            args: {
                id: {
                    type: new GraphQLNonNull( idType ? idType : GraphQLString )
                }
            },
            resolve: ( sourceValue, args, ctx ) => {
                const p = provider.removeById(args.id);

                const loader = ctx.resolveLoader(type);
                loader.clear(args.id);

                return p;
            }
        };
    }


    _defineMutation_insert( engine, type, idType ) {
        const provider = this.provider;
        const inputType = engine.lookupInputType(MongooseTypeFactory.buildInputDataTypeName(type.name));

        return {
            name: type.name + '_insert',
            type: engine.lookupObjectType('MutationResult'),//idType ? idType : GraphQLString,
            args: {
                data: {
                    type: new GraphQLNonNull(inputType)
                }
            },
            resolve: ( sourceValue, args, ctx ) => {
                return provider.insert(args.data).then( row => {
                    const r = row._id;
                    return r;
                 } );
            }
        };
    }


    _defineMutation_update( engine, type, idType ) {
        const provider = this.provider;
        const inputType = engine.lookupInputType(MongooseTypeFactory.buildInputDataTypeName(type.name));
        
        return {
            name: type.name + '_update',
            type: engine.lookupObjectType('MutationResult'),//idType ? idType : GraphQLString,
            args: {
                id: {
                    type: new GraphQLNonNull( idType ? idType : GraphQLString )
                },
                data: {
                    type: new GraphQLNonNull(inputType)
                }
            },
            resolve: ( sourceValue, args, ctx ) => {
                return provider.update(args.data).then( row => row._id );
            }
        };
    }

}


module.exports = MongooseTypeFactory;
