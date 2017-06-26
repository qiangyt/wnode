import * as Path from 'path';


export class CodePath {

    public static baseDir = Path.dirname(require.main.filename);

    static resolve( dir:string ):string {
        return Path.join( CodePath.baseDir, dir );
    }

}

