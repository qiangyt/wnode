import Context from '../ctx/Context';

export default class RootAPI {

    auth( ctx:Context) {
        ctx.$auth.ensureRoot();
        ctx.ok();
    }

}
