import Context from '../ctx/Context';

export default class OrgUserAPI {

    auth( ctx:Context, userId:any /* required:false */, orgId:any /* required:false */) {
        ctx.$auth.ensureSelfOrOrgAdmin( userId, orgId );
        ctx.ok();
    }

}
