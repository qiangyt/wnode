import {registerAsBean} from '../Internal';

import Schemas from './Schemas';
import SwaggerHelper from './SwaggerHelper';


export default {

    Schemas,
    SwaggerHelper

};


registerAsBean(Schemas);
registerAsBean(SwaggerHelper);