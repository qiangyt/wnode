import Context from  '../ctx/Context';
import * as ApiRole from '../ApiRole';


export default class InternalContext extends Context {

    public next:any;

    constructor( public final:any = undefined ) {
        super(undefined);

        this.$auth.internal = true;
        this.$auth.roles = this.$auth.roles.concat([
            ApiRole.admin, 
            ApiRole.admin, 
            ApiRole.user, 
            ApiRole.user_admin, 
            ApiRole.root, 
            ApiRole.org_user, 
            ApiRole.org_admin
        ]);
    }


    /**
     * 
     */
    done( failed:boolean, result:any, status:number ) {
        if( this.tryDone() ) return;
    
        this.result = result;
        
        this.final();
    }

    ok( result:any ) {
        if( !this.next ) {
            // 本次A调用结束
            return this.done( false, result, 200 );
        }
      
        // 如果本次调用还未结束，那么把当前步骤的执行结果合并到this.values里，以便后续步骤使用
        if( result) {
          Object.assign( this.values, result );
        }

        this.next( this );
    }

}
