import Context from '../ctx/Context';

export default class OrgAdminAPI {

    auth( ctx:Context, userId:any /* required:false */, orgId:any /* required:false */) {
        ctx.$auth.ensureOrgAdmin( userId, orgId );
        ctx.ok();
    }

}
