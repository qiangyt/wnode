import TestContext from './TestContext';
import * as Util from 'util';
import * as Sinon from 'sinon';
import Context from '../ctx/Context';

declare module global {
    const bearcat:any;
}


export default class TestSuite {

    public ctx:Context;
    public sinons:any[];


    constructor() {
        this.ctx = null;
    }

    beforeEach() {
        this.ctx = new TestContext();

        this.sinons = [];

        return Promise.resolve();
    }

    stubWithMethod( object:any, methodName:string, func:Function ) {
        const r = Sinon.stub( object, methodName, func );
        this.sinons.push(r);
        return r;
    }

    spyWithMethod( object:any, methodName:string ) {
        const r = Sinon.spy( object, methodName );
        this.sinons.push(r);
        return r;
    }

    mock( object:any ) {
        const r = Sinon.mock( object );
        this.sinons.push(r);
        return r;
    }


    afterEach() {
        this.sinons.forEach( sinon => sinon.restore() );

        return Promise.resolve();
    }


    static exportsClass( suiteClass:any ) {
        const pt = suiteClass.prototype;

        global.bearcat.module(suiteClass);
        const test = global.bearcat.getBean(suiteClass.name);

        const suite:any = {
            //before: before,
            beforeEach: pt.beforeEach.bind(test),
            afterEach: pt.afterEach.bind(test)
        };

        // 遍历取得所有的前缀是test的方法，然后把这些方法bind到test并加入suite
        for( let propName of Object.getOwnPropertyNames(pt) ) {
            if( propName.indexOf('test') !== 0 ) continue;
            let prop = pt[propName];
            if( Util.isFunction(prop) ) {
                suite[propName] = prop.bind(test);
            }
        }

        return {
            [suiteClass.name]: suite
        };
    }

}
