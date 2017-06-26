import {registerAsBean} from '../Internal';

import {Schemas} from './Schemas';
import {SwaggerHelper} from './SwaggerHelper';


export {

    Schemas,
    SwaggerHelper

};


registerAsBean(Schemas);
registerAsBean(SwaggerHelper);