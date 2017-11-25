import Context from '../ctx/Context';

export default class UserAPI {

    auth( ctx:Context, userId:any /* required:false */ ) {
        ctx.$auth.ensureSelfOrAdmin(userId);
        ctx.ok();
    }

}
