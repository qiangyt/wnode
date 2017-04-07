/**
 * 扩展Error对象，以便放置一个自定义数据
 */
export default class Exception extends Error {

    public data:any[];
    public args:any[];
    
    constructor( ...data:any[] ) {
        super('');
        this.data = data;
        this.args = ( arguments.length > 1 ) ? Array.from(arguments).slice(1) : [];
    }
}



