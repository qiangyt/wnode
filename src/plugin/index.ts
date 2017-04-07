const requireAsBean = require('../Internal').requireAsBean;

export default {

    PluginComponentBuilder:  require( './PluginComponentBuilder' ),
    PluginEngine:            requireAsBean( module, './PluginEngine' ),
    PluginInstanceDao:       requireAsBean( module, './PluginInstanceDao' ),
    PluginInstanceProvider:  requireAsBean( module, './PluginInstanceProvider' )

};
