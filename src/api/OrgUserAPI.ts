import Context from '../ctx/Context';
const ApiRole = require('../ApiRole');


export default class OrgUserAPI {

    static apiMeta:any = {
        role: [ApiRole.org_user]
    };

    auth( ctx:Context, userId:any /* required:false */, orgId:any /* required:false */) {
        ctx.$auth.ensureTargetOrgUserAccessible( userId, orgId );
        ctx.ok();
    }

}
