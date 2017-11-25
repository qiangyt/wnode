import Context from '../ctx/Context';

export default class AdminAPI {

    auth( ctx:Context) {
        ctx.$auth.ensureAdmin();
        ctx.ok();
    }

}
