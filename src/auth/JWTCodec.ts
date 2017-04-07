import * as Jwt from 'jsonwebtoken';
import JWToken from './JWToken';
import * as ApiRole from '../ApiRole';
import * as uuid from 'node-uuid';
import AuthTokenCodec from './AuthTokenCodec';
import AuthToken from './AuthToken';
import BaseContext from '../ctx/BaseContext';


/**
 * JWT编解码器
 */
export default class JWTCodec extends AuthTokenCodec {

    public $id = 'JWTCodec';
    public $lazy = true;
    public $init = 'init';
    public config:any;

    init() {
        let cfg = global.config.jwt;
        if( !cfg ) cfg = global.config.jwt = {};

        if( !cfg.algorithm ) cfg.algorithm = 'HS256';
        if( !cfg.key ) cfg.key = uuid.v4();

        this.config = cfg;
    }

    /**
     * 编码
     */
    encode( token:AuthToken ) {
        const cfg = this.config;
        const me = this;

        return new Promise( function( resolve, reject ) {
            const options = me.buildEncodeOptions(token);
            const payload = me.buildEncodePayload(token);
            
            Jwt.sign( payload, cfg.key, options, function( err, encoded ) {
                if( err ) return reject(err);
                resolve(encoded);
            } );
        } );
    }

    /**
     * 生成编码用payload
     */
    buildEncodePayload( token:AuthToken ) {
        const r:any = {};

        if( token.userId ) r.uid = token.userId;
        if( token.roles ) r.rol = token.roles;
        if( token.internal ) r.itn = token.internal;
        if( token.data ) r.dat = token.data;

        return r;
    }

    /**
     * 生成编码用options
     */
    buildEncodeOptions( token:AuthToken ) {
        const cfg = this.config;

        const r:any = {
            algorithm: cfg.algorithm
        };

        if( token.expireByMinutes ) r.expiresIn = token.expireByMinutes * 60;
        if( cfg.encodeIssuer ) r.issuer = cfg.encodeIssuer;
        if( cfg.encodeSubject ) r.subject = cfg.encodeSubject;

        return r;
    }

    /**
     * 解码
     */
    decode( ctx:BaseContext, tokenText:string ) {
        const cfg = this.config;
        const me = this;
        
        return new Promise( function( resolve, reject ) {
            const options = me.buildDecodeOptions();

            Jwt.verify( tokenText, cfg.key, options, function( err, decoded ) {
                if( err ) return reject(err);
                resolve(decoded);
            } );
        } ).then( decoded => this.decodeAsToken(ctx, decoded) );
    }

    /**
     * 生成解码用options
     */    
    buildDecodeOptions() {
        const cfg = this.config;
        
        const r:any = {
            algorithm: cfg.algorithm,
            ignoreExpiration: (cfg.ignoreExpiration === true) 
        };

        if( cfg.decodeIssuer ) r.issuer = cfg.decodeIssuer;
        if( cfg.decodeSubject ) r.subject = cfg.decodeSubject;

        return r;
    }

    /**
     * 解码成token对象（JWToken)
     */
    decodeAsToken( ctx:BaseContext, decoded:any ) {
        const expireByMinutes:number = undefined;//TODO

        let userId = decoded.uid;
        if( userId ) userId = parseInt(userId, 10);

        let roles = decoded.rol;
        if( !roles ) roles = [ApiRole.any];
        
        let internal = decoded.itn;
        if( internal === undefined || internal === null ) internal = false;

        return new JWToken( userId, expireByMinutes, roles, decoded.dat, internal );
    }

    /**
     * @{override}
     */
    createEmptyToken() {
        return new JWToken( null, null, [ApiRole.any], null, false );
    }

}

