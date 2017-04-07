const requireAsBean = require('../Internal').requireAsBean;


export default {

    Schemas:        requireAsBean(module, './Schemas'),
    SwaggerHelper:  requireAsBean(module, './SwaggerHelper')

};
