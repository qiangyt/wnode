//const requireAsBean = require('../Internal').requireAsBean;
export default {

    AliSearchJobQueue: require('./AliSearchJobQueue'),
    //ToyJobQueue:    requireAsBean(module, './ToyJobQueue'),
    kue:            require('./kue')

};
