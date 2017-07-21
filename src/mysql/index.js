'use strict';

/* eslint 'no-unused-vars': 'off' */
const requireAsBean = require('../Internal').requireAsBean;


module.exports = {

    MySqlConnection: require('./MySqlConnection').default,
    MySqlPool: requireAsBean(module, './MySqlPool')

};