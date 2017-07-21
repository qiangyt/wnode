import * as Fs from 'fs';
import * as Path from 'path';
import CodePath from '../util/CodePath';
import * as Mongoose from 'mongoose';
import * as Log from '../Logger';
import * as _ from 'lodash';

declare module global {
    const config:any;
}


export default class MongooseInstance {

    public schemas:any = {};
    public models:any = {};
    public connection:Mongoose.Connection;
    public schemaDir:string;
    public logger:Log.Logger;


    constructor( public instanceName:string, public config:any ) {
        this.logger = Log.create('Mongoose.' + (instanceName ? instanceName : '<default>'));
    }

    /**
     * 
     */
    init() {
        this.logger.info( 'connecting...' );
        this.connection = this.createConnection();

        this.schemaDir = this.resolveSchemaDir();

        this.logger.info( {schemaDir: this.schemaDir}, 'importing schema' );
        this.importSchemas();
    }

    /**
     * 初始化实例
     */
    createConnection() {
        let options = this.config;

        let uri = options.uri || 'mongodb://127.0.0.1:27017/' + this.instanceName;

        this.logger.info( {uri}, 'uri' );
        this.logger.info( {options}, 'options' );

        const r = Mongoose.createConnection( uri, options );

        r.on( 'error', (err:any) => {
            this.logger.error( {err}, 'connection error' );
        } );

        r.once( 'open', () => {
            this.logger.info('connected');
        } );

        return r;
    }

    /**
     * 取得schema目录。
     * 
     * 缺省是源代码根目录下的mongoose子目录。可以通过config文件中的server.mongooseDir指定schema子目录。
     * 并且，如果instanceName非空，那么会取根mongoose目录下的具有相应名字的子目录为该实例的schema目录，
     * 例如，源代码根目录是./src，instanceName为admin，那么该实例的schema目录是./src/mongoose/admin。
     */
    resolveSchemaDir() {
        let t = global.config.server.mongooseDir;
        if( !t ) t = 'mongoose'; // 缺省是源文件根目录下的mongoose子目录
        if( this.instanceName ) t = Path.join( t, this.instanceName );
        return CodePath.resolve(t);
    }

    /**
     * 导入指定目录里的所有schema（不递归，即不会导入子目录）
     */
    importSchemas() {
        /*eslint no-sync: "off"*/
        for( const fileName of Fs.readdirSync(this.schemaDir) ) {
            if( !fileName.endsWith('.js') ) continue;

            const full = Path.join( this.schemaDir, fileName );
            const stat = Fs.statSync(full);
            if( stat.isDirectory() ) continue; // 跳过子目录

            const schema = require(full);
            const schemaName = Path.basename( full, '.js' );
            this.importSchema( schema, schemaName );
        }
    }


    importSchema( schema:any, schemaName:string ) {
        const collectionName = _.snakeCase(schemaName);
        const model = this.connection.model( schemaName, schema, collectionName );

        this.schemas[schemaName] = schema;
        this.models[schemaName] = model;

        /*
        let hasSearchIndices = false;
        const searchIndices = {};
        const fields = schema.obj;
        for( const fieldName in fields ) {
            const field = fields[fieldName];
            if( field.searchable ) {
                searchIndices[fieldName] = 'text';
                hasSearchIndices = true;
            }
        }
        if( hasSearchIndices ) {
            const coll = model.db.collections[collectionName];
            coll.createIndex(searchIndices);
        }*/
        
    }

}
