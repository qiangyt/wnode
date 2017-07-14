'use strict';

const requireAsBean = require('../Internal').requireAsBean;


module.exports = {

    AliMemcached: requireAsBean(module, './AliMemcached'),
    CacheTemplate: require('./CacheTemplate'),
    Memcached: requireAsBean(module, './Memcached'),
    RedisInstance: require('./RedisInstance'),
    RedisManager: require('./RedisManager')

};