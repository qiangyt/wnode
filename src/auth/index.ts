//import {requireAsBean} from '../Internal';
import {registerAsBean} from '../Internal';

import AuthToken from './AuthToken';
import AuthTokenCodec from './AuthTokenCodec';
import JWTAuth from './JWTAuth';
import JWTCodec from './JWTCodec';
import JWToken from './JWToken';
import SimpleAuth from './SimpleAuth';


export {
    AuthToken,
    AuthTokenCodec,
    JWTAuth,
    JWTCodec,
    JWToken,
    SimpleAuth
};

registerAsBean(AuthTokenCodec);
registerAsBean(JWTAuth);
registerAsBean(JWTCodec);
registerAsBean(SimpleAuth);

//export {AuthTokenCodec as AuthTokenCodec} from './AuthTokenCodec';


/*export AuthTokenCodec;

    JWTAuth:        requireAsBean(module, './JWTAuth'),
    JWTCodec:       requireAsBean(module, './JWTCodec'),
export * from './JWToken';
    SimpleAuth:     requireAsBean(module, './SimpleAuth')

};
*/