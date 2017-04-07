const requireAsBean require('../Internal').requireAsBean;


export default {

    AuthToken:      require('./AuthToken'),
    AuthTokenCodec: requireAsBean(module, './AuthTokenCodec'),
    JWTAuth:        requireAsBean(module, './JWTAuth'),
    JWTCodec:       requireAsBean(module, './JWTCodec'),
    JWToken:        require('./JWToken'),
    SimpleAuth:     requireAsBean(module, './SimpleAuth')

};
