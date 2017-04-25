//import {requireAsBean} from '../Internal';
import {registerAsBean} from '../Internal';


import CacheTemplate from './CacheTemplate';
import RedisInstance from './RedisInstance';
import RedisManager from './RedisManager';
import AliMemcached from './AliMemcached';
import Memcached from './Memcached';

export {
    CacheTemplate,
    RedisInstance,
    RedisManager,
    AliMemcached,
    Memcached
};

registerAsBean(AliMemcached);
registerAsBean(Memcached);