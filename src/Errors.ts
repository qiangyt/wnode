import ErrorType from './ErrorType';


const errorMapByCode:any = {};
const SYS_CODE_START = 1;
const SYS_CODE_END = 1000;

let sysErrorInited = false;

/**
 * 加载error定义的json文件。
 * 格式例子参见./Errors.json
 * 
 * @param jsonFilePath error定义的json文件的路径
 */
export function register( codeStart:number, codeEnd:number, jsonFilePath:string ) {
    if( codeStart >= codeEnd ) throw new Error('code start value (' + codeStart + ') must be less than code end value (' + codeEnd + ')');
    if( sysErrorInited ) {
        if( codeStart <= SYS_CODE_END ) {
            throw new Error('code range (' + codeStart + '~' + codeEnd + ') conflicts with system error codes(' + SYS_CODE_START + '~' + SYS_CODE_END + ')');
        }
    }

    const errors = require(jsonFilePath );

    for( let key in errors ) {
        if( module.exports[key] ) throw new Error('duplicated error key: ' + key);

        const e = errors[key];
        const code = e.code;
        if( code === 0 ) throw new Error('code cannot be 0: ' + key);
        if( sysErrorInited && (SYS_CODE_START < code && code < SYS_CODE_END) ) {
            throw new Error('code ' + code + ' conflicts with system error codes(' + SYS_CODE_START + '~' + SYS_CODE_END + ')');
        }
        if( errorMapByCode[code] ) throw new Error('duplicated error code: ' + code);
        
        const type = new ErrorType( key, code, e );
        module.exports[key] = type;
        errorMapByCode[code] = type;
    }

};

// 初始化系统内部错误
register( SYS_CODE_START, SYS_CODE_END, './Errors.json' );
sysErrorInited = true;

