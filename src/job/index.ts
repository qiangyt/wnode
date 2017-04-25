import {registerAsBean} from '../Internal';

import AliSearchJobQueue from './AliSearchJobQueue';
import * as kue from './kue';

export {

    AliSearchJobQueue,
    kue

};

registerAsBean(AliSearchJobQueue);