import Context from '../ctx/Context';
const ApiRole = require('../ApiRole');


export default class OrgAdminAPI {

    static apiMeta:any = {
        role: [ApiRole.org_admin]
    };

    auth( ctx:Context, userId:any /* required:false */, orgId:any /* required:false */) {
        ctx.$auth.ensureTargetOrgUserAccessible( userId, orgId );
        ctx.ok();
    }

}
