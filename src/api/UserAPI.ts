import Context from '../ctx/Context';
const ApiRole = require('../ApiRole');


export default class UserAPI {

    static apiMeta:any = {
        role: ApiRole.user
    };

    auth( ctx:Context, userId:any /* required:false */ ) {
        ctx.$auth.ensureSelfOrAdmin(userId);
        ctx.ok();
    }

}
