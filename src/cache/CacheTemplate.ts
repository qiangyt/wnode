
export default class CacheTemplate {

    static get( cacheHitPromise, cacheMissPromise, cacheSetterPromise ) {
        return cacheHitPromise()
            .then( function(result) {
                if( result !== undefined ) return result;// hit cache

                return cacheMissPromise()
                    .then( function(result) {
                        return cacheSetterPromise(result);
                    } );
            } );
    }

}

