const Mkdirp = require('mkdirp');


function createFolderIfNotExists_sync(path) {
    return Mkdirp.sync(path);
}


function createFolderIfNotExists_async(path) {
    return new Promise(function(resolve, reject) {
        Mkdirp(path, function(err, made) {
            if (err) reject(err);
            resolve(made);
        });
    });
}


function createConfiguredFolderIfNotExists(cfg, configName, defaultPath) {
    let path = cfg[configName];
    if (!path) {
        if (!defaultPath) throw new Error(`<file.${configName}> is not configured`);
        cfg[configName] = path = defaultPath;
    }

    createFolderIfNotExists_sync(path);
}


function loadFileConfig() {
    let r = global.config.file;
    if (!r) {
        r = global.config.file = {
            workFolder: global.workFolder
        };
    }
    return r;
}


function loadUploadConfig() {
    let r = loadFileConfig();
    if (!r.upload) {
        r.upload = {
            enable: true,
            port: global.config.server.httpPort + 1,
            temp: `${global.workFolder}/upload`
        };
    }
    return r.upload;
}


module.exports = {

    createFolderIfNotExists_sync,
    createFolderIfNotExists_async,
    createConfiguredFolderIfNotExists,

    loadFileConfig,
    loadUploadConfig

};
