import * as _ from 'lodash';
import MySqlSequelizer from './MySqlSequelizer';
import BaseSequelizer from './BaseSequelizer';

declare module global {
    const config:any;
}


/**
 * sequelizer实例管理类。
 * 这个类管理了一个实例注册表（实例名映射到实例对象）。
 * 每一个实例都是按需创建，即，不被使用时不会被创建。
 */
export default class SequelizerManager {

    public static instance = new SequelizerManager();

    public sequelizers:any = {}; // 保存sequelize实例名字到sequelize实例对象的映射关系
    public defaultSequelizer:BaseSequelizer; // 缺省实例


    /**
     * 通过名字查找sequelize实例。
     * 
     * @param instanceName 实例名字。如果非空（大部分微服务只需要连接单一数据库，所以通常不需要指定实例名字），那么取缺省实例。
     */
    get( instanceName:string ) {
        let r:BaseSequelizer = instanceName ? this.sequelizers[instanceName] : this.defaultSequelizer;

        if( !r ) {
            // 如果指定名字的实例尚未创建，那么在这里创建它
            this.sequelizers[instanceName] = r = this.create(instanceName);
            if( !this.defaultSequelizer && !instanceName ) this.defaultSequelizer = r;//如果缺省实例还没有设定，那么在这里设定
        }

        return r;
    }

    /**
     * 创建一个实例
     */
    create( instanceName:string ) {
        // 实例名字不可以是sequelize，因为我们约定根配置数据的结构如下：
        // mysql: {
        //    host: '...', // 非sequelize特定的mysql配置数据，以便其它ORM根据重用这个配置数据
        //    port: '...',
        //    sequelize: { sequelize特定的mysql配置数据 },
        //    实例名字1: {
        //        host: '...', // 非sequelize特定的mysql配置数据，以便其它ORM根据重用这个配置数据
        //        port: '...',
        //        sequelize: { sequelize特定的mysql配置数据 },   
        //    },
       //    实例名字2: {
        //        host: '...', // 非sequelize特定的mysql配置数据，以便其它ORM根据重用这个配置数据
        //        port: '...',
        //        sequelize: { sequelize特定的mysql配置数据 },   
        //    },
       //    实例名字x: {
        //        host: '...', // 非sequelize特定的mysql配置数据，以便其它ORM根据重用这个配置数据
        //        port: '...',
        //        sequelize: { sequelize特定的mysql配置数据 },   
        //    }
        // }
        //
        // 所以，实例名字如果是sequelize，就会和配置数据中的sequelize小节发生冲突
        if( 'sequelize' === instanceName ) throw new Error('instance name should NOT be "sequelize"');
        
        let instanceConfig;
        const globalConfig = global.config.database;
        if( !instanceName ) {
            instanceConfig = globalConfig;
        } else {
            if( !globalConfig[instanceName] ) throw new Error('please configure section: database.' + instanceName);

            instanceConfig = _.cloneDeep(globalConfig);
            _.merge( instanceConfig, globalConfig[instanceName] );
        }

        if( !instanceConfig.dialect ) instanceConfig.dialect = 'mysql';
        
        if( instanceConfig.dialect === 'mysql' ) return new MySqlSequelizer( instanceName, instanceConfig );

        throw new Error( 'database dialect "' + instanceConfig.dialect + ' is not supported yet' );
    }

}
