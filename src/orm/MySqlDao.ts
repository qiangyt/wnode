import SequelizeDao from './SequelizeDao';


/**
 * MySQL DAO基类。
 * 
 * 保留这个类的部分原因是为了兼容以前版本。实际上，这个类已经不做什么MySQL特定的处理了，而是由SequelizeDao统一处理。
 * 另一个原因是预留下今后放置MySQL特定的处理代码的空间。
 */
export default class MySqlDao extends SequelizeDao {


}

