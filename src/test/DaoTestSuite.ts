import TestSuite from './TestSuite';
import SequelizerManager from '../orm/SequelizerManager';
import * as Sequelize from 'sequelize';


export default class DaoTestSuite extends TestSuite {

    public _sequelizer:Sequelize.Sequelize;


    constructor(public sequelizerName:string) {
        super();
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
