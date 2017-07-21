'use strict';


/* eslint 'no-unused-vars': 'off' */
const requireAsBean = require('../Internal').requireAsBean;


module.exports = {

    AuthToken: require('./AuthToken').default,
    AuthTokenCodec: requireAsBean(module, './AuthTokenCodec'),
    JWTAuth: requireAsBean(module, './JWTAuth'),
    JWTCodec: requireAsBean(module, './JWTCodec'),
    JWToken: require('./JWToken').default,
    SimpleAuth: requireAsBean(module, './SimpleAuth')

};