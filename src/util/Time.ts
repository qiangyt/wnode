


export default class Time {

    /**
     * 
     */
    static formatAsISO8601( time:Date ) {
        return Time.formatDate(time) + 'T' + Time.formatTime(time, false) + 'Z';
    }

    /**
     * 
     */
    static format( time:Date, includeMilliseconds:boolean ) {
        return Time.formatDate(time) + ' ' + Time.formatTime(time, includeMilliseconds);
    }

    /**
     * 
     */
    static formatYearMonth( time:Date ) {
        return Time.formatYear(time) + '-' + Time.formatMonth(time);
    }

    static formatYear( time:Date ) {
        return '' + time.getFullYear();
    }

    static formatMonth( time:Date ) {
        const mon = time.getMonth() + 1;
        return (( mon < 10 ) ? '0' : '') + mon;
    }

    /**
     * 
     */
    static formatDate( time:Date ) {
        return Time.formatYearMonth(time) + '-' + Time.formatDay(time);
    }

    static formatDay( time:Date ) {
        const date = time.getDate();
        return (( date < 10 ) ? '0' : '') + date;
    }

    static formatHours( time:Date ) {
        const hour = time.getHours();
        return (( hour < 10 ) ? '0' : '') + hour;
    }

    static formatMinutes( time:Date ) {
        const min = time.getMinutes();
        return (( min < 10 ) ? '0' : '') + min;
    }

    static formatSeconds( time:Date ) {
        const sec = time.getSeconds();
        return (( sec < 10 ) ? '0' : '') + sec;
    }

    /**
     * 
     */
    static formatTime( time:Date, includeMilliseconds:boolean ) {
        let result = '';

        result += Time.formatHours(time);
        result += ':' + Time.formatMinutes(time);
        result += ':' + Time.formatSeconds(time);
    
        if( includeMilliseconds ) {
            result += '.' + time.getMilliseconds();
        }

        return result;
    }

}
