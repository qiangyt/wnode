'use strict';

/* eslint no-unused-vars:'off' */

const DataLoader = require('dataloader');
const TypeFactory = require('./TypeFactory');
const Moment = require('moment');
const g = require('graphql');
const GraphQLList = g.GraphQLList;
const GraphQLEnumType = g.GraphQLEnumType;
const GraphQLString = g.GraphQLString;
const GraphQLInt = g.GraphQLInt;
const GraphQLBoolean = g.GraphQLBoolean;
const GraphQLObjectType = g.GraphQLObjectType;
const GraphQLScalarType = g.GraphQLScalarType;
const GraphQLNonNull = g.GraphQLNonNull;
const InputCategory = require('./InputCategory');


const _TYPE_NAME__MANIFEST = 'Manifest';
const _TYPE_NAME__FIELD = 'ManifestField';
const _TYPE_NAME__GROUP = 'ManifestGroup';


//TODO: convert the error to GraphQL error
class ManifestTypeFactory extends TypeFactory {


    _defineObjectType_Field( engine ) {
        const provider = this.provider;

        return {
            name: _TYPE_NAME__FIELD,
            createLoader( ctx ) {
                return new DataLoader( idArray => {
                    return provider.auth( ctx, _TYPE_NAME__FIELD, 'list', null, {idArray} )
                    .then( () => {
                        const manifests = provider.listManifest(idArray);
                        return Promise.resolve(manifests);
                    } );
                 } );
            },
            fields: {
                name: {
                    type: g.GraphQLString,
                    resolve: field => field.name
                },
                label: {
                    type: g.GraphQLString,
                    resolve: field => field.label
                },
                order: {
                    type: g.GraphQLInt,
                    resolve: field => field.order
                },
                sortable: {
                    type: g.GraphQLBoolean,
                    resolve: field => field.sortable
                },
                filterable: {
                    type: g.GraphQLBoolean,
                    resolve: field => field.filterable
                },
                searchable: {
                    type: g.GraphQLBoolean,
                    resolve: field => field.searchable
                },
                inputCategory: {
                    type: engine.lookupObjectType(InputCategory.name),
                    resolve: field => field.inputCategory
                }
            }
        };
    }


    _defineObjectType_Manifest( engine, groupType, fieldType ) {
        const provider = this.provider;

        return {
            name: _TYPE_NAME__MANIFEST,
            createLoader( ctx ) {
                return new DataLoader( idArray => {
                    return provider.auth( ctx, _TYPE_NAME__MANIFEST, 'list', null, {idArray} )
                    .then( () => {
                        const manifests = provider.listManifest(idArray);
                        return Promise.resolve(manifests);
                    } );
                 } );
            },
            fields: {
                id: {
                    type: g.GraphQLString,
                    resolve: manifest => manifest.id
                },
                label: {
                    type: g.GraphQLString,
                    resolve: manifest => manifest.label
                },
                description: {
                    type: g.GraphQLString,
                    resolve: manifest => manifest.description
                },
                group: {
                    type: groupType,
                    resolve: manifest => manifest.group
                },
                groupId: {
                    type: g.GraphQLString,
                    resolve: manifest => manifest.groupId
                },
                fields: {
                    type: new g.GraphQLList(fieldType),
                    resolve: manifest => manifest.fields
                },
                searchable: {
                    type: g.GraphQLBoolean,
                    resolve: manifest => manifest.searchable
                }
            }
        };
    }


    _defineObjectType_Group( engine ) {
        const provider = this.provider;

        return {
            name: _TYPE_NAME__GROUP,
            createLoader( ctx ) {
                return new DataLoader( idArray => {
                    return provider.auth( ctx, _TYPE_NAME__GROUP, 'list', null, {idArray} )
                    .then( () => {
                        const groups = provider.listGroup(idArray);
                        return Promise.resolve(groups);
                    } );
                 } );
            },
            fields: {
                id: {
                    type: g.GraphQLString,
                    resolve: group => group.id
                }
            }
        };
    }


    _defineObjectType_MutationResult( engine ) {
        const provider = this.provider;

        return {
            name: 'MutationResult',
            fields: {
                id: {
                    type: g.GraphQLString,
                    resolve: '//TODO'
                }
            }
        };
    }


    _defineScalar_DateTime() {
        return {
            name: TypeFactory.DATETIME,
            description: '日期(带时分秒)',
            serialize( value ) {
                return Moment.format(value);
            },
            parseValue( value ) {
                return Moment(value);
            },
            parseLiteral( ast ) {
                return Moment(ast.value);
            }
        };
    }


    _defineEnum_InputCategory() {
        return {
            name: InputCategory.name,
            values: {
                SHORT_TEXT: {
                    value: InputCategory.SHORT_TEXT
                },
                LONG_TEXT: {
                    value: InputCategory.LONG_TEXT
                },
                INT: {
                    value: InputCategory.INT
                },
                FLOAT: {
                    value: InputCategory.FLOAT
                },
                DATETIME: {
                    value: InputCategory.DATETIME
                },
                BOOLEAN: {
                    value: InputCategory.BOOLEAN
                }
            }
        };


    }


    /** @override */
    defineObjectTypes( engine ) {
        const type_InputCategory = new GraphQLEnumType(this._defineEnum_InputCategory());
        engine.addObjectType(type_InputCategory);

        const type_MutationResult = new GraphQLObjectType(this._defineObjectType_MutationResult());
        engine.addObjectType(type_MutationResult);

        const type_DateTime = new GraphQLScalarType(this._defineScalar_DateTime());
        engine.addObjectType(type_DateTime);

        const type_Group = new GraphQLObjectType(this._defineObjectType_Group(engine));
        engine.addObjectType(type_Group);

        const type_Field = new GraphQLObjectType(this._defineObjectType_Field(engine));
        engine.addObjectType(type_Field);
        
        const type_Manifest = new GraphQLObjectType(this._defineObjectType_Manifest( engine, type_Group, type_Field ));
        engine.addObjectType(type_Manifest);

        // group type的manfifests这个field的type是manifest[]，导致group和manifest存在
        // 双向引用关系，所以无法在_defineObjectType_Group()里直接设定这个引用关系，必须
        // 在manifest type创建后再设定。
        type_Group._typeConfig.fields.manifests = {
            type: new GraphQLList(type_Manifest),
            resolve: group => group.manifestList
        };
    }


    _defineQuery_listAllManifest( engine ) {
        const type = engine.lookupObjectType(_TYPE_NAME__MANIFEST);
        const provider = this.provider;

        return {
            name: type.name + '_all',
            type: new GraphQLList(type),
            resolve: () => provider.listAllManifest()
        };
    }


    _defineQuery_listAllGroup( engine ) {
        const type = engine.lookupObjectType(_TYPE_NAME__GROUP);
        const provider = this.provider;
        
        return {
            name: type.name + '_all',
            type: new GraphQLList(type),
            resolve: () => provider.listAllGroup()
        };
    }


    _defineQueries_Manifest( engine ) {
        const r = this._defineQueries( engine, _TYPE_NAME__MANIFEST );
        r.push(this._defineQuery_listAllManifest(engine));
        return r;
    }


    _defineQueries_Group( engine ) {
        const r = this._defineQueries( engine, _TYPE_NAME__GROUP );
        r.push(this._defineQuery_listAllGroup(engine));
        return r;
    }


    /** @override */
    defineQueries( engine ) {
        return this._defineQueries_Manifest(engine)
        .concat(this._defineQueries_Group(engine));
    }

}


module.exports = ManifestTypeFactory;
