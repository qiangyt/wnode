

/**
 * 封装一个sequelizer事务实例
 */
export default class SequelizerTx {

    constructor(sequelizer) {
        this.sequelizer = sequelizer;
        this.key = 'sequelizer-' + (sequelizer.instanceName ? sequelizer.instanceName : 'default');
    }


    enlistTx( options ) {
        return this.sequelizer.transaction(options);
    }


    commitTx( txData ) {
        return txData.commit();
    }


    rollbackTx( txData ) {
        return txData.rollback();
    }

}

