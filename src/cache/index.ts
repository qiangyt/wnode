const requireAsBean = require('../Internal').requireAsBean;


export default {

    AliMemcached: requireAsBean(module, './AliMemcached'),
    CacheTemplate: require('./CacheTemplate'),
    Memcached: requireAsBean(module, './Memcached'),
    RedisInstance: require('./RedisInstance'),
    RedisManager: require('./RedisManager')

};
