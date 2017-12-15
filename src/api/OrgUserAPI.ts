import Context from '../ctx/Context';
const ApiRole = require('../ApiRole');


export default class OrgUserAPI {

    static apiMeta:any = {
        role: [ApiRole.org_user]
    };

    auth( ctx:Context, userId:number /* type:'integer', required:false */, orgId:number /* type:'integer', required:false */) {
        ctx.$auth.ensureTargetOrgUserAccessible( userId, orgId );
        ctx.ok();
    }

}
