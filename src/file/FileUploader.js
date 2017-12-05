'use strict';

const Logger = require('../Logger');
const FileHelper = require('../file/FileHelper');
const formidable = require('formidable');
const http = require('http');
const util = require('util');


//https://github.com/felixge/node-formidable.git

class FileUploader {

    constructor() {
        this.$id = 'FileUploader';
        this.$init = '_init';
        this.logger = Logger.create(this);
        this.$lazy = true;
    }

    _createFormidable() {
        const cfg = this.config;

        // parse a file upload
        const r = new formidable.IncomingForm();

        //Sets encoding for incoming form fields.
        r.encoding = cfg.encoding || 'utf-8';

        //Sets the directory for placing file uploads in. You can move them later on using fs.rename(). The default is os.tmpdir().
        r.uploadDir = cfg.this.config.temp;

        //If you want the files written to form.uploadDir to include the extensions of the original files, set this property to true.
        r.keepExtensions = (cfg.keepExtensions === undefined) ? true : cfg.keepExtensions;
        //Limits the amount of memory all fields together (except files) can allocate in bytes. If this value is exceeded, an 'error' event is emitted. The default size is 2MB.

        r.maxFieldsSize = cfg.maxFieldsSize || 2 * 1024 * 1024;

        //Limits the number of fields that the querystring parser will decode. Defaults to 1000 (0 for unlimited).
        r.maxFields = cfg.maxFields || 1000;

        //If you want checksums calculated for incoming files, set this to either 'sha1' or 'md5'.
        r.hash = (cfg.maxFields === undefined) ? false : cfg.hash;

        //If this option is enabled, when you call form.parse, the files argument will contain arrays of files for inputs which submit multiple files using the HTML5 multiple attribute.
        r.multiples = (cfg.multiples === undefined) ? false : cfg.multiples;

        //r.bytesExpected //The expected number of bytes in this form.
        //r.bytesReceived //The amount of bytes received for this form so far.
        //r.type //Either 'multipart' or 'urlencoded' depending on the incoming request.

        return r;
    }

    _init() {
        let cfg = this.config = FileHelper.loadUploadConfig();

        FileHelper.createConfiguredFolderIfNotExists(cfg, 'temp');

        if (!cfg.port) throw new Error('<file.upload.port> is not configured');

        this.server = http.createServer((req, res) => {
            if (req.url !== '/upload') return;

            if (req.method.toLowerCase() !== 'post') {
                this.showFileUploadForm(res);
                return;
            }

            const form = this._createFormidable();

            form.parse(req, (err, fields, files) => {
                if (err) {
                    this.logger.error('TODO');
                    return; //TODO: error response
                }

                res.writeHead(200, { 'content-type': 'text/plain' });
                res.write('received upload:\n\n');
                res.end(util.inspect({ fields: fields, files: files }));

                //file.size = 0//The size of the uploaded file in bytes. If the file is still being uploaded (see 'fileBegin' event), this property says how many bytes of the file have been written to disk yet.
                //file.path = null//The path this file is being written to. You can modify this in the 'fileBegin' event in case you are unhappy with the way formidable generates a temporary path for your files.
                //file.name = null//The name this file had according to the uploading client.
                //file.type = null//The mime type of this file, according to the uploading client.
                //Formidable.File#toJSON()//This method returns a JSON-representation of the file, allowing you to JSON.stringify() the file which is useful for logging and responding to requests.

                //'progress'//Emitted after each incoming chunk of data that has been parsed. Can be used to roll your own progress bar.
                //form.on('progress', function(bytesReceived, bytesExpected) {});
                //});

                //'error'
                //Emitted when there is an error processing the incoming form. A request that experiences an error is automatically paused, you will have to manually call request.resume() if you want the request to continue firing 'data' events.
                //form.on('error', function(err) {});

                //'aborted'
                //Emitted when the request was aborted by the user. Right now this can be due to a 'timeout' or 'close' event on the socket. After this event is emitted, an error event will follow. In the future there will be a separate 'timeout' event (needs a change in the node core).

                //form.on('aborted', function() {});
                //'end'

                //form.on('end', function() {});
                //Emitted when the entire request has been received, and all contained files have finished flushing to disk. This is a great place for you to send your response.

                return;
            });


        });

    }


    start() {
        const port = this.config.port;
        this.server.listen(port);
        this.logger.info(`uploader is listening on ${port}`);
    }


    // show a file upload form
    showFileUploadForm(res) {

        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(
            '<form action="/upload" enctype="multipart/form-data" method="post">' +
            '<input type="text" name="title"><br>' +
            '<input type="file" name="upload" multiple="multiple"><br>' +
            '<input type="submit" value="Upload">' +
            '</form>'
        );
    }

}


module.exports = FileUploader;