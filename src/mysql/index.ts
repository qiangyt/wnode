const requireAsBean = require('../Internal').requireAsBean;

export default {

    MySqlConnection:    require('./MySqlConnection'),
    MySqlPool:          requireAsBean(module, './MySqlPool')

};
