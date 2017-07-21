

export default class SqlBuilder {

    public $id = 'SqlBuilder';
    public $lazy = true;
    

    /**
     * 生成insert SQL语句：insert into <表名> (列1,列2,列3,...) values (?,?,?...)
     * 
     * @param tableName 表名
     * @param columns 列名数组
     */
    insert( tableName:string, columns:string[] ) {
        const placeholders = [];

        for( let i = 0; i < columns.length; i++ ) {
            placeholders.push('?');
        }

        return ['insert into', tableName, '(', columns.join(', '), ') values (', placeholders.join(', '), ')'].join(' ');
    }

    /**
     * 生成update SQL语句：update <表名> set 列1=?,列2=?,列3=?,... where 条件1=? and 条件2=? ....
     * 即：条件表达式只支持AND和=
     * 
     * @param tableName 表名
     * @param conditions 条件数组
     * @param columns 列名数组
     */
    update( tableName:string, conditions:string[], columns:string[] ) {
        const valueSql = [];
        for( let column of columns ) valueSql.push( column + '=?' );

        const condSql = [];
        for( let cond of conditions ) condSql.push( cond + '=?' );

        return ['update', tableName, 'set', valueSql.join(', '), 'where', condSql.join(' and ')].join(' ');
    }

}
