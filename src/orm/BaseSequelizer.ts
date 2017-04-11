import * as Fs from 'fs';
import * as Path from 'path';
import CodePath from '../util/CodePath';
import * as Log from '../Logger';
import * as Util from 'util';
import * as Sequelize from 'sequelize';

declare module global {
    const config:any;
}


/**
 * 封装一个sequelizer实例
 */
export default class BaseSequelizer {

    public instance:Sequelize.Sequelize;
    public modelDir:string;
    public logger:Log.Logger;
    

    constructor( public instanceName:string, public config:any ) {
        this.logger = Log.create('Sequelizer.' + (instanceName ? instanceName : '<default>') );
        this.init();
    }

    /**
     * 
     */
    init() {
        this.logger.info( 'creating instance' );
        this.instance = this.createInstance();

        this.modelDir = this.resolveModelDir();

        this.logger.info( {modelDir: this.modelDir}, 'importing models' );
        this.importModels();

        // 所有model都已经导入，于是可以初始化model间的关联关系了
        this.logger.info( 'initializing model relationship' );
        this.initRelations();
    }

    /**
     * 初始化实例
     */
    createInstance():Sequelize.Sequelize {
        throw new Error('please init the sequelize here');
    }

    /**
     * 取得model目录。
     * 
     * 缺省是源代码根目录下的sequelize子目录。可以通过config文件中的server.sequelizeDir指定model子目录。
     * 并且，如果instanceName非空，那么会取根model目录下的具有相应名字的子目录为该实例的model目录，
     * 例如，源代码根目录是./src，instanceName为admin，那么该实例的model目录是./src/sequelize/admin。
     */
    resolveModelDir() {
        let t = global.config.server.sequelizeDir;
        if( !t ) t = 'sequelize'; // 缺省是源文件根目录下的model子目录
        if( this.instanceName ) t = Path.join( t, this.instanceName );
        return CodePath.resolve(t);
    }

    /**
     * 导入指定目录里的所有model（不递归，即不会导入子目录）
     */
    importModels() {
        /*eslint no-sync: "off"*/
        for( const fileName of Fs.readdirSync(this.modelDir) ) {
            if( !fileName.endsWith('.js') ) continue;
            if( fileName === 'Relation.js' ) continue;

            const full = Path.join( this.modelDir, fileName );
            const stat = Fs.statSync(full);
            if( stat.isDirectory() ) continue; // 跳过子目录
            
            this.instance.import(full);
        }
    }

    /**
     * 初始化model间的关联关系
     */
    initRelations() {
        let relationJsPath = Path.join( this.modelDir, 'Relation.js' );

        // 仅Relation.js文件存在时才继续
        try {
            Fs.statSync(relationJsPath);
        } catch( e ) {
            return;
        }
        
        const relationFunc = require(relationJsPath);
        if( !Util.isFunction(relationFunc) ) throw new Error(relationJsPath + ' doesn\'t export a function');

        relationFunc( this.instance, this.instance.models );
    }

}
