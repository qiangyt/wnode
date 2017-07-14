'use strict';

const requireAsBean = require('../Internal').requireAsBean;


module.exports = {

    PluginComponentBuilder:  require( './PluginComponentBuilder' ),
    PluginEngine:            requireAsBean( module, './PluginEngine' ),
    PluginInstanceDao:       requireAsBean( module, './PluginInstanceDao' ),
    PluginInstanceProvider:  requireAsBean( module, './PluginInstanceProvider' )

};
