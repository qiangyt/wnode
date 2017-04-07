import Util = require('util');
import Time = require('./Time');

export default class VO {

    static toTimeMilli( date ) {
        if( Util.isNullOrUndefined(date) ) return date;
        if( Util.isDate(date) === false ) return null;
        return date.getTime();
    }

    static toISO8601( date ) {
        return Time.formatAsISO8601(VO.toTimeMilli(date));
    }

}

