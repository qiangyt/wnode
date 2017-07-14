'use strict';


/* eslint 'no-unused-vars': 'off' */
const requireAsBean = require('../Internal').requireAsBean;


module.exports = {

    AuthToken: require('./AuthToken'),
    AuthTokenCodec: requireAsBean(module, './AuthTokenCodec'),
    JWTAuth: requireAsBean(module, './JWTAuth'),
    JWTCodec: requireAsBean(module, './JWTCodec'),
    JWToken: require('./JWToken'),
    SimpleAuth: requireAsBean(module, './SimpleAuth')

};