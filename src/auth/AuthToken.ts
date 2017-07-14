import * as ApiRole from '../ApiRole';
import {Exception} from '../Exception';
const Errors = require('../Errors');


export interface AuthResult {
    ok:boolean,
    absentRoles?:number[]
}


export default class AuthToken {

    constructor( public userId:any, 
                 public expireByMinutes:number, 
                 public roles = [ApiRole.any], 
                 public data?:any, 
                 public internal?:boolean ) {

        for( let role of this.roles ) {
            if( ApiRole.isInternal(role) ) {
                throw new Error( "shouldn't specify internal roles directly" );
            }
        }
    }

    /**
     * 
     */
    internalCopy():AuthToken {
        return new AuthToken( this.userId, this.expireByMinutes, this.roles, this.data, true );
    }

    ensureSelfOrAdmin( userId:any = this.userId ):void {
        if( this.userId === userId ) return;

        // 如果不是自己，那么当前用户必须是系统管理员
        if( !this.hasRole(ApiRole.admin) ) {
            throw new Exception( Errors.NO_PERMISSION, ApiRole.admin );
        }
    }

    /**
     * 
     */
    hasRoles( expectedRoles:number[] ):AuthResult {
        if( !expectedRoles || expectedRoles.length === 0 ) {
            // 如果expectedRoles为空，那么无需权限检查
            return {ok: true};
        }

        const absentRoles = [];
        for( let expectedRole of expectedRoles ) {
            if( this.hasRole(expectedRole) ) return {ok: true};
            absentRoles.push(expectedRole);
        }

        if( absentRoles.length ) {
            return {ok: false, absentRoles: absentRoles};
        }
        
        return {ok: true};
    }

    /**
     * 
     */
    hasRole( expectedRole:number ) {
        if( expectedRole === ApiRole.any ) return true;

        if( this.internal ) {
            if( ApiRole.isInternal(expectedRole) === false ) {
                // 如果当前用户的实际角色是internal，而目标角色不是internal，那么可以放行
                return true;
            }
            // 目标角色是某种internal角色的情况下，因为this.roles里保存的都是非internal roles，所以要把expectedRole里
            // 的internal标志位去除
            expectedRole = ApiRole.getRegularRole(expectedRole);
            if( expectedRole === ApiRole.any ) return true;
        }

        const actualRoles = this.roles;
        if( actualRoles === undefined || actualRoles.length === 0 ) {
            // 如果actualRoles为空，那么仅当expectedRole也为空时才被认为具有权限
            return (expectedRole === undefined);
        }

        for( let actualRole of actualRoles ) {
            if( actualRole === expectedRole ) return true;
        }

        return false;
    }

}

exports.AuthToken = AuthToken;