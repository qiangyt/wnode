import TestSuite = require('./TestSuite');
import SequelizerManager = require('../orm/SequelizerManager');


export default class DaoTestSuite extends TestSuite {

    constructor(sequelizerName) {
        super();
        this.sequelizerName = sequelizerName;
    }


    sequelizer() {
        let r = this._sequelizer;
        if( !r ) r = this._sequelizer = SequelizerManager.instance.get(this.sequelizerName).instance;
        return r;
    }


    beginTx() {
        const options = {/*
            //autocommit: true,
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
        */};

        this.ctx._beginTx(options);
        return;
    }


    rollbackTx() {
        return this.ctx.rollbackTx();
    }


    beforeEach() {
        return super.beforeEach()
        .then( () => this.beginTx() );
    }


    afterEach() {
        return super.afterEach()
        .then( () => this.rollbackTx() );
    }

}
