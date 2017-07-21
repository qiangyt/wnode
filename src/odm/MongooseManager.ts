import * as _ from 'lodash';
import MongooseInstance from './MongooseInstance';

declare module global {
    const config:any;
}

// for backwards compatibility, Mongoose 4 uses mpromise (https://www.npmjs.com/package/mpromise) as built-in
// promise library by default. However, Mongoose said it's better to replace it with system promises.
//Mongoose.Promise = global.Promise;


/**
 * mongoose实例管理类。
 * 这个类管理了一个实例注册表（实例名映射到实例对象）。
 * 每一个实例都是按需创建，即，不被使用时不会被创建。
 */
export default class MongooseManager {

    public static instance = new MongooseManager();


    public instances:any = {}; // 保存mongoose实例名字到mongoose实例对象的映射关系
    public defaultInstance:MongooseInstance = null; // 缺省实例

    /**
     * 通过名字查找mongoose实例。
     * 
     * @param instanceName 实例名字。如果非空（大部分微服务只需要连接单一数据库，所以通常不需要指定实例名字），那么取缺省实例。
     */
    get( instanceName:string ) {
        let r:MongooseInstance = instanceName ? this.instances[instanceName] : this.defaultInstance;

        if( !r ) {
            // 如果指定名字的实例尚未创建，那么在这里创建它
            this.instances[instanceName] = r = this.create(instanceName);
            if( !this.defaultInstance && !instanceName ) this.defaultInstance = r;//如果缺省实例还没有设定，那么在这里设定
        }

        return r;
    }

    /**
     * 创建一个实例
     */
    create( instanceName:string ) {
        
        let instanceConfig;
        const globalConfig = global.config.mongodb;
        if( !instanceName ) {
            instanceConfig = globalConfig;
        } else {
            if( !globalConfig[instanceName] ) throw new Error('please configure section: mongodb.' + instanceName);

            instanceConfig = _.cloneDeep(globalConfig);
            _.merge( instanceConfig, globalConfig[instanceName] );
        }

        const r = new MongooseInstance( instanceName, instanceConfig );
        r.init();
        return r;
    }

}
