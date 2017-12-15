import Context from '../ctx/Context';
const ApiRole = require('../ApiRole');


export default class UserAPI {

    static apiMeta:any = {
        role: [ApiRole.user]
    };

    auth( ctx:Context, userId:number /* type:'integer', required:false */) {
        ctx.$auth.ensureTargetUserAccessible( userId );
        ctx.ok();
    }

}
