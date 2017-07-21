
export default class CacheTemplate {

    static get<T>( cacheHitPromise:Promise<T>, cacheMissPromise:Promise<T>, cacheSetterPromise:Promise<T> ) {
        return cacheHitPromise
            .then( function(result:T) {
                if( result !== undefined ) return result;// hit cache

                return cacheMissPromise
                    .then( function(result) {
                        cacheSetterPromise.then( ()=> {
                            //TODO: logger
                        } ).catch( () => {
                            //TODO
                        } );
                        return result;
                    } );
            } );
    }

}
