import * as Sequelize from 'sequelize';


/**
 * 封装一个sequelizer事务实例
 */
export default class SequelizerTx {

    public key:string;


    constructor(public sequelizer:Sequelize.Sequelize) {
        this.key = 'sequelizer-' + ((<any>sequelizer).instanceName ? (<any>sequelizer).instanceName : 'default');
    }


    enlistTx( options:Sequelize.TransactionOptions ) {
        return (<any>this.sequelizer).transaction(options);
    }


    commitTx( txData:Sequelize.Transaction ) {
        return <any>txData.commit();
    }


    rollbackTx( txData:Sequelize.Transaction ) {
        return <any>txData.rollback();
    }

}
