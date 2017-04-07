import Util = require('util');


export default class Time {

    /**
     * 
     */
    static formatAsISO8601( time ) {
        return Time.formatDate(time) + 'T' + Time.formatTime(time, false) + 'Z';
    }

    /**
     * 
     */
    static format( time, includeMilliseconds ) {
        return Time.formatDate(time) + ' ' + Time.formatTime(time, includeMilliseconds);
    }

    /**
     * 
     */
    static formatYearMonth( time ) {
        const t = Util.isDate(time) ? time : new Date( time );

        let result = '' + t.getFullYear();

        const mon = t.getMonth() + 1;
        result += '-' + (( mon < 10 ) ? '0' : '') + mon;

        return result;
    }

    /**
     * 
     */
    static formatDate( time ) {
        const t = Util.isDate(time) ? time : new Date( time );

        let result = Time.formatYearMonth( t );

        const date = t.getDate();
        result += '-' + (( date < 10 ) ? '0' : '') + date;
    
        return result;
    }

    /**
     * 
     */
    static formatTime( time, includeMilliseconds ) {
        const t = Util.isDate(time) ? time : new Date(time);

        let result = '';

        const hour = t.getHours();
        result += (( hour < 10 ) ? '0' : '') + hour;

        const min = t.getMinutes();
        result += ':' + (( min < 10 ) ? '0' : '') + min;

        const sec = t.getSeconds();
        result += ':' + (( sec < 10 ) ? '0' : '') + sec;
    
        if( includeMilliseconds ) {
            result += '.' + t.getMilliseconds();
        }

        return result;
    }

}
