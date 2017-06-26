//import {requireAsBean} from '../Internal';
import {registerAsBean} from '../Internal';

import {AuthToken as _AuthToken} from './AuthToken';
import {AuthTokenCodec as _AuthTokenCodec } from './AuthTokenCodec';
import {JWTAuth as _JWTAuth} from './JWTAuth';
import {JWTCodec as _JWTCodec} from './JWTCodec';
import {JWToken as _JWToken} from './JWToken';
import {SimpleAuth as _SimpleAuth} from './SimpleAuth';


export module auth {

    export declare class AuthToken extends _AuthToken {}
    export declare class AuthTokenCodec extends _AuthTokenCodec {}
    export declare class JWTAuth extends _JWTAuth {}
    export declare class JWTCodec extends _JWTCodec {}
    export declare class JWToken extends _JWToken {}
    export declare class SimpleAuth extends _SimpleAuth {}

}
/*
export {
    auth.AuthToken,
    auth.AuthTokenCodec,
    auth.JWTAuth,
    auth.JWTCodec,
    auth.JWToken,
    auth.SimpleAuth
};*/

registerAsBean(_AuthTokenCodec);
registerAsBean(_JWTAuth);
registerAsBean(_JWTCodec);
registerAsBean(_SimpleAuth);

//export {AuthTokenCodec as AuthTokenCodec} from './AuthTokenCodec';


/*export AuthTokenCodec;

    JWTAuth:        requireAsBean(module, './JWTAuth'),
    JWTCodec:       requireAsBean(module, './JWTCodec'),
export * from './JWToken';
    SimpleAuth:     requireAsBean(module, './SimpleAuth')

};
*/
