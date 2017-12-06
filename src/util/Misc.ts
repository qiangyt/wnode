import * as NodeUuid from 'node-uuid';

export function uuid():string {
    return NodeUuid.v4();
}

export function prettyJson(obj:any):string {
    return JSON.stringify(obj, null, 4);
}
