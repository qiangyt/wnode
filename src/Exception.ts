/**
 * 扩展Error对象，以便放置一个自定义数据
 */
export default class Exception extends Error {

    constructor( data ) {
        super('');
        this.data = data;
        this.args = ( arguments.length > 1 ) ? Array.from(arguments).slice(1) : [];
    }
}



