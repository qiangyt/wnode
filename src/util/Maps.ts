export function objectToStringMap( object:any ):Map<string,string|number> {
    if( object === null ) return null;
    if( object === undefined ) return undefined;
    
    const r = new Map<string,string|number>();
    for( let key in object ) {
        r.set( key, object[key] );
    }
    return r;
}
