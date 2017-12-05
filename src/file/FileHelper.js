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
        path = defaultPath;
    }

    createFolderIfNotExists_sync(path);
}


function loadFileConfig() {
    let r = global.config.file;
    if (!r) throw new Error('<file> section is not configured');
    return r;
}


function loadUploadConfig() {
    let r = loadFileConfig();
    if (!r.upload) throw new Error('<file.upload> section is not configured');
    return r.upload;
}


module.exports = {

    createFolderIfNotExists_sync,
    createFolderIfNotExists_async,
    createConfiguredFolderIfNotExists,

    loadFileConfig,
    loadUploadConfig

};