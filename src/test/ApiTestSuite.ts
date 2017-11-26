import DaoTestSuite from './DaoTestSuite';
const Errors = require('../Errors');
import Exception from '../Exception';
import * as _ from 'lodash';


declare module global {
    const assert:any;
}


export default class ApiTestSuite extends DaoTestSuite {

    checkTooLongParameter(api:any, length:number) {
        const parameter = _.fill([], 'a', 0, length).join();

        return api.check(this.ctx, parameter)
            .catch((err:Exception) => {
                global.assert.equal(err.data, Errors.PARAMETER_TOO_LONG);
            });
    }

}
