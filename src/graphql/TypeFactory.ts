import g = require('graphql');
const GraphQLList = g.GraphQLList;
const GraphQLString = g.GraphQLString;
const GraphQLNonNull = g.GraphQLNonNull;


/* eslint no-unused-vars:'off' */


export default class TypeFactory {

    constructor( provider ) {
        this.provider = provider;
    }

    
    /** @override */
    defineObjectTypes( engine ) {
        throw new Error('to be implemented');
    }


    /** @override */
    defineQueries( engine ) {
        throw new Error('to be implemented');
    }


    /** @override */
    defineMutations( engine ) {
        return [];
    }


    _defineQuery_get( type, idType ) {
        const provider = this.provider;
        
        return {
            name: type.name + '_get',
            type,
            args: {
                id: {
                    type: new GraphQLNonNull( idType ? idType : GraphQLString )
                }
            },
            resolve: ( sourceValue, args, ctx ) => {
                const loader = ctx.resolveLoader(type);
                return loader.load(args.id);
            }
        };
    }


    _defineQuery_list( type, idType ) {
        const provider = this.provider;

        return {
            name: type.name + '_list',
            type: new GraphQLList(type),
            args: {
                idArray: {
                    type: new GraphQLNonNull(new GraphQLList( idType ? idType : GraphQLString ))
                }
            },
            resolve: ( sourceValue, args, ctx ) => {
                const loader = ctx.resolveLoader(type);
                return loader.loadMany(args.idArray);
            }
        };
    }


    _defineQueries( engine, typeName, idType ) {
        const type = engine.lookupObjectType(typeName);

        return [
            this._defineQuery_get( type, idType ),
            this._defineQuery_list( type, idType )
        ];
    }

}


TypeFactory.DATETIME = 'DateTime';
