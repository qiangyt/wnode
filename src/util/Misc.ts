import * as NodeUuid from 'node-uuid';

export function uuid():string {
    return NodeUuid.v4();
}
