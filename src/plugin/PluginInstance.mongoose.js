'use strict';


const Mongoose = require('mongoose');


module.exports = new Mongoose.Schema( {
    pluginId: {
        type: String, 
        index: true,
        manifest: {
            label: '插件ID',
            filterable: true
        }
    },
    programId: {
        type: Number,
        format: 'int',
        index: true,
        manifest: {
            label: '节目ID',
            filterable: true
        }
    },
    loginRequired: {
        type: Boolean,
        manifest: {
            label: '是否需要用户登录'
        }
    },
    beginTime: {
        type: Date,
        manifest: {
            label: '开始时间'
        }
    },
    endTime: {
        type: Date,
        manifest: {
            label: '结束时间'
        }
    }

}, {
    autoIndex: true,
    bufferCommands: false,
    strict: 'throw'
} );
