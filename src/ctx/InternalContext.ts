import BaseContext = require( '../ctx/BaseContext' );
import JWTAuth = require('../auth/JWTAuth');
import ApiRole = require('../ApiRole');


export default class InternalContext extends BaseContext {

    constructor( final ) {
        super(undefined);

        this.next = null;
        this.final = final;
        this.$auth = JWTAuth.globalAuthBean().createEmptyToken();

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
        
        this.beginTime = new Date().getTime();
    }


    /**
     * 
     */
    done( failed, result ) {
        if( this.tryDone() ) return;
    
        this.result = result;
        
        this.final();
    }

    ok( result ) {
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

