import Context from '../ctx/Context';
const ApiRole = require('../ApiRole');


export default class OrgAdminAPI {

    static apiMeta:any = {
        role: [ApiRole.org_admin]
    };

    auth( ctx:Context, userId:number /* type:'integer', required:false */, orgId:number /* type:'integer', required:false */) {
        ctx.$auth.ensureTargetOrgUserAccessible( userId, orgId );
        ctx.ok();
    }

}
