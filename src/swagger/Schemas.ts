import * as Fs from 'fs';
import * as Path from 'path';
import CodePath from '../util/CodePath';
import * as Util from 'util';
import * as Sequelize from 'sequelize';
import SwaggerHelper from './SwaggerHelper';
import SequelizerManager from '../orm/SequelizerManager';


export default class Schemas {

    constructor() {
        this.$id = 'Schemas';
        this.$init = 'init';
    }

    init() {
        this.mapByName = {};
        
        this.mapByName['Error'] = SwaggerHelper.errorSchema();

        const schemaDir = this.resolveSchemaDirectory();
        if( schemaDir ) {
            this.scanSchemas(schemaDir, true);
        }
    }

    /*eslint no-sync: "off"*/        
    resolveSchemaDirectory() {
        const r = CodePath.resolve( global.config.server.schemaDir ? global.config.server.schemaDir : './schema' );
        try {
            Fs.statSync(r);
        } catch( e ) {
            return null;
        }
        return r;
    }

    all() {
        for( let name in this.mapByName ) {
            const schemaOrFunction = this.mapByName[name];
            if( Util.isFunction(schemaOrFunction) ) {
                this.mapByName[name] = schemaOrFunction();
            }
        }
        return this.mapByName;
    }

    /*eslint no-sync: "off"*/
    scanSchemas(schemaDir, prefixWithServiceName) {
        for( const fileName of Fs.readdirSync(schemaDir) ) {
            const full = Path.join(schemaDir, fileName);
            this.addSchema( Path.parse(full).name, require(full), prefixWithServiceName );
        }
    }


    addSchema( name, schema, prefixWithServiceName ) {
        if( prefixWithServiceName ) {
            name = SwaggerHelper.schemaName( name, prefixWithServiceName );
        }
        if( this.mapByName[name] ) {
            throw new Error( 'duplicated schema: name=' + name );
        }
        this.mapByName[name] = schema;
    }


    static buildSchemaFromSequelizer( modelName, instanceName ) {
        const sequelizer = SequelizerManager.instance.get(instanceName);
        if( !sequelizer ) throw new Error('sequelizer "' + instanceName + '" not found');
        
        const model = sequelizer.instance.models[modelName];
        if( !model ) throw new Error('model "' + modelName + '" not found in sequelizer "' + instanceName + '"');
        
        const properties = {};
        const attrs = model.attributes;
        for( let attrName in attrs ) {
            const attr = attrs[attrName];
            properties[attrName] = Schemas.propertyFromSequelizerAttribute(attr);
        }

        return {
            type: 'object',
            properties: properties
        };
    }

    /* eslint complexity: "off" */
    static propertyFromSequelizerAttribute( attr ) {
        const r = {
            description: attr.comment
        };

        const attrType = attr.type;
        
        if( attrType instanceof Sequelize.BIGINT ) {
            r.type = 'integer';
            //r.format = 'int64'; 
        } else if( attrType instanceof Sequelize.STRING ) {
            r.type = 'string'; 
        } else if( attrType instanceof Sequelize.CHAR ) {
            r.type = 'string'; 
        } else if( attrType instanceof Sequelize.TEXT ) {
            r.type = 'string'; 
        } else if( attrType instanceof Sequelize.NUMBER ) {
            r.type = 'number'; 
        } else if( attrType instanceof Sequelize.INTEGER ) {
            r.type = 'integer'; 
            //r.format = 'int32';
        } else if( attrType instanceof Sequelize.FLOAT ) {
            r.type = 'number';
            //r.format = 'float'; 
        } else if( attrType instanceof Sequelize.TIME ) {
            r.type = 'string';
            //r.format = 'date'; 
        } else if( attrType instanceof Sequelize.DATE ) {
            r.type = 'string';
            //r.format = 'date-time'; 
        } else if( attrType instanceof Sequelize.DATEONLY ) {
            r.type = 'string';
            //r.format = 'date-time'; 
        } else if( attrType instanceof Sequelize.BOOLEAN ) {
            r.type = 'boolean'; 
        } else if( attrType instanceof Sequelize.NOW ) {
            throw new Error('TODO');
        } else if( attrType instanceof Sequelize.BLOB ) {
            r.type = 'string'; 
            //r.format = 'binary';
        } else if( attrType instanceof Sequelize.DECIMAL ) {
            r.type = 'number'; 
            //r.format = 'double';
        } else if( attrType instanceof Sequelize.ENUM ) {
            throw new Error('TODO');
        } else if( attrType instanceof Sequelize.DOUBLE ) {
            r.type = 'number'; 
            //r.format = 'double';
        } else {
            throw new Error('unknown data type');
        } 

        if( attr.allowNull === undefined || attr.allowNull === true ) {
            //r.type = [r.type, 'null'];
            //r.required = false;
        }

        return r;
    }


    get(name) {
        return this.mapByName[name];
    }

}

