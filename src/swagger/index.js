'use strict';

const requireAsBean = require('../Internal').requireAsBean;


module.exports = {

    Schemas: requireAsBean(module, './Schemas'),
    SwaggerHelper: requireAsBean(module, './SwaggerHelper')

};