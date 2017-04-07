

export default class Base64 {

    /**
     * base64编码
     */
    static encode( toEncode ) {
        return new Buffer(toEncode).toString('base64');
    }

    /**
     * base64解码
     */
    static decode( base64EncodedString ) {
        return new Buffer( base64EncodedString, 'base64' ).toString();
    }

}

