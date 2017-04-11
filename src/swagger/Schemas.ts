import * as Fs from 'fs';
import * as Path from 'path';
import CodePath from '../util/CodePath';
import * as Util from 'util';
import * as Sequelize from 'sequelize';
import SwaggerHelper from './SwaggerHelper';
import SequelizerManager from '../orm/SequelizerManager';

declare module global {
    const config:any;
}



export default class Schemas {

    public $id = 'Schemas';
    public $init = 'init';
    public mapByName:any = {};

    init() {
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
    scanSchemas(schemaDir:string, prefixWithServiceName:boolean) {
        for( const fileName of Fs.readdirSync(schemaDir) ) {
            const full = Path.join(schemaDir, fileName);
            this.addSchema( Path.parse(full).name, require(full), prefixWithServiceName );
        }
    }


    addSchema( name:string, schema:string, prefixWithServiceName:boolean ) {
        if( prefixWithServiceName ) {
            name = SwaggerHelper.schemaName( name, prefixWithServiceName );
        }
        if( this.mapByName[name] ) {
            throw new Error( 'duplicated schema: name=' + name );
        }
        this.mapByName[name] = schema;
    }


    static buildSchemaFromSequelizer( modelName:string, instanceName:string ) {
        const sequelizer = SequelizerManager.instance.get(instanceName);
        if( !sequelizer ) throw new Error('sequelizer "' + instanceName + '" not found');
        
        const model = sequelizer.instance.models[modelName];
        if( !model ) throw new Error('model "' + modelName + '" not found in sequelizer "' + instanceName + '"');
        
        const properties:any = {};
        const attrs:any = (<any>model).attributes;
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
    static propertyFromSequelizerAttribute( attr:any ) {
        const r = {
            description: attr.comment,
            type:<string>(undefined)
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
        } else if( attrType instanceof <any>Sequelize.NUMBER ) {
            r.type = 'number'; 
        } else if( attrType instanceof Sequelize.INTEGER ) {
            r.type = 'integer'; 
            //r.format = 'int32';
        } else if( attrType instanceof Sequelize.FLOAT ) {
            r.type = 'number';
            //r.format = 'float'; 
        } else if( attrType instanceof <any>Sequelize.TIME ) {
            r.type = 'string';
            //r.format = 'date'; 
        } else if( attrType instanceof Sequelize.DATE ) {
            r.type = 'string';
            //r.format = 'date-time'; 
        } else if( attrType instanceof <any>Sequelize.DATEONLY ) {
            r.type = 'string';
            //r.format = 'date-time'; 
        } else if( attrType instanceof <any>Sequelize.BOOLEAN ) {
            r.type = 'boolean'; 
        } else if( attrType instanceof <any>Sequelize.NOW ) {
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


    get(name:string) {
        return this.mapByName[name];
    }

}

