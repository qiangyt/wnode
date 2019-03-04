const Condor = require('apyer-condor-framework');
import * as Fs from 'fs';
import * as Path from 'path';
import CodePath from '../util/CodePath';
import * as Log from '../Logger';


declare module global {
  const config:any;
  const bearcat:any;
}

export default class GrpcServer {

  public $id = 'GrpcServer';
  public $init = 'init';
  public $lazy = true;
  private condor:any;
  public logger:Log.Logger;
  public controllerDir:string;
  public config:any;

  init() {
    this.logger = Log.create(this);

    this.logger.info( 'creating gRPC server' );

    this.config = global.config.grpc;
    
    if (!this.config.options) {
      throw new Error('grpc.options NOT specified');
    }
    if (!this.config.options.listen) {
      throw new Error('grpc.options.listen NOT specified');
    }
    if (!this.config.options.rootProtoPath) {
      throw new Error('grpc.options.rootProtoPath NOT specified');
    }
    
    this.config.grpc.controller = this.config.grpc.controller || {};
    this.config.grpc.controller.dir = CodePath.resolve(this.config.grpc.controller.dir || 'grpc/controller');
    
    this.condor = new Condor(this.config.options);

    this.logger.info( {controllerDir: this.config.grpc.controller.dir}, 'registering controller' );
    this.logger.info( 'registered controller' );

    this.addBean('Greeter');
  }

  /**
   * 导入指定目录里的所有controller（不递归，即不会导入子目录）
   */
  registerController() {
    /*eslint no-sync: "off"*/
    const dir = this.config.grpc.controller.dir;
    for( const fileName of Fs.readdirSync(dir) ) {
        if( !fileName.endsWith('.js') ) continue;

        const full = Path.join( dir, fileName );
        const stat = Fs.statSync(full);
        if( stat.isDirectory() ) continue; // 跳过子目录
          
        const path = Path.parse(full);
        const beanName = path.name;  
        const mod = require(full);
        if (!mod.protoFilePath) {
          throw new Error(beanName + '.protoFilePath NOT specified');
        } 

        let impl = global.bearcat.getBean(beanName);
        if (!impl) {
          // register the module to bearcat if not yet do so
          global.bearcat.module(mod);
          impl = global.bearcat.getBean(beanName);
        }

        this.addService(impl.proto, beanName, impl);
    }
  }

  addBean(beanName:string) {
    const impl = global.bearcat.getBean(beanName);
    this.addService(impl.proto, beanName, impl);    
  }

  addService(protoFilePath:string, serviceName:string, impl:any) {    
    this.condor.add(protoFilePath, serviceName, impl);
  }

  start() {
    this.condor.start();
  }

}

module.exports = GrpcServer;
