
const roleMapByValue:any = {};
const roleMapByName:any = {};

const INTERNAL_MASK = 0x10;
const REGULAR_MASK = 0x0F; //是对 INTERNAL_MASK 的按位取反

module.exports = roleMapByName;


export function hasName( name:string ):boolean {
    return roleMapByName[name] !== undefined;
}
module.exports.hasName = hasName;

export const hasValue = function( value:number ):boolean {
    return roleMapByValue[value] !== undefined;
}
module.exports.hasValue = hasValue;

export function byName( name:string ):number {
    return roleMapByName[name];
}
module.exports.byName = byName;

export function byValue( value:number ):string {
    return roleMapByValue[value];
}
module.exports.byValue = byValue;

export function byValueArray( values:number[] ):string[] {
    const names = [];
    for( let value of values ) {
        names.push( module.exports.byValue(value) );
    }
    return names;
}
module.exports.byValueArray = byValueArray;

export function getRegularRole( value:number ):number {
    /* eslint no-bitwise:'off' */
    return value & REGULAR_MASK; 
};
module.exports.getRegularRole = getRegularRole;

export function isInternal( value:number ):boolean {
    /* eslint no-bitwise:'off' */
    return ((value & INTERNAL_MASK) === INTERNAL_MASK);
};
module.exports.isInternal = isInternal;

/* eslint complexity:['error',11] */
export function add( name:string, value:number ):number {
    if( name === 'add' ) throw new Error( 'role name cannot be "add"' );
    if( name === 'hasName' ) throw new Error( 'role name cannot be "hasName"' );
    if( name === 'hasValue' ) throw new Error( 'role name cannot be "hasValue"' );
    if( name === 'byName' ) throw new Error( 'role name cannot be "byName"' );
    if( name === 'byValue' ) throw new Error( 'role name cannot be "byValue"' );
    if( name === 'byValueArray' ) throw new Error( 'role name cannot be "byValueArray"' );
    if( name === 'regularRole' ) throw new Error( 'role name cannot be "regularRole"' );
    if( name === 'isInternal' ) throw new Error( 'role name cannot be "isInternal"' );

    if( hasName(name) ) throw new Error( 'duplicated role name: ' + name );
    if( hasValue(value) ) throw new Error( 'duplicated role value: ' + value );

    roleMapByName[name] = value;
    roleMapByValue[value] = name;

    return value;
}

// 非内部角色
export const any = add( 'any', 0 );            // 无需登录
export const admin = add( 'admin', 1 );          // 需要登录为系统管理员
export const user = add( 'user', 2 );           // 需要登录为普通用户
export const user_admin = add( 'user_admin', 3 );     // 需要登录为用户管理员
export const root = add( 'root', 4 );           // 需要登录为系统超级用户
export const org_user = add( 'org_user', 5 );       // 需要登录为组织用户
export const org_admin = add( 'org_admin', 6 );      // 需要登录为组织管理员

// 内部角色
// 内部角色的value(整数)，是把对应的非内部角色的值按位或上 INTERNAL_MASK
/* eslint no-bitwise:'off' */
export const any_internal = add( 'any_internal', any | INTERNAL_MASK );     // 系统内部组件之间通信时使用
export const admin_internal = add( 'admin_internal', admin | INTERNAL_MASK );     // 系统内部组件之间通信时使用，并且需要登录为系统管理员
export const user_internal = add( 'user_internal', user | INTERNAL_MASK );     // 系统内部组件之间通信时使用，并且需要登录为普通用户
export const user_admin_internal = add( 'user_admin_internal', user_admin | INTERNAL_MASK );     // 系统内部组件之间通信时使用，并且需要登录为用户管理员
export const org_user_internal = add( 'org_user_internal', org_user | INTERNAL_MASK );     // 系统内部组件之间通信时使用，并且需要登录为组织用户
export const org_admin_internal = add( 'org_admin_internal', org_admin | INTERNAL_MASK );     // 系统内部组件之间通信时使用，并且需要登录为组织管理员
export const root_internal = add( 'root_internal', root | INTERNAL_MASK );     // 系统内部组件之间通信时使用，并且需要登录为系统超级管理员

