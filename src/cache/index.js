'use strict';

const requireAsBean = require('../Internal').requireAsBean;


module.exports = {

    AliMemcached: requireAsBean(module, './AliMemcached'),
    CacheTemplate: require('./CacheTemplate').default,
    Memcached: requireAsBean(module, './Memcached'),
    RedisInstance: require('./RedisInstance').default,
    RedisManager: require('./RedisManager').default

};