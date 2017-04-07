import InternalContext = require( '../ctx/InternalContext' );
import Logger = require('../Logger');


/**
 * This is a POC implementation which is not product-ready. The product-ready queue should
 * integrate with a dedicated (distributed) job middleware.
 */
export default class ToyJobQueue {

    constructor() {
        this.$id = 'ToyJobQueue';
        this.$lazy = true;
        this.$init = 'init';
        this.logger = Logger.create(this);
    }


    init() {
        this._tasks = [];
        this._actions = {};
        setInterval( () => {
            try {
                this._execute();
            } catch( e ) {
                this.logger.error( e, 'failed to execute task' );
            }
        }, 1000 );
    }


    _execute() {
        if( this._tasks.length <= 0 ) return;
        
        const batch = this._tasks;
        this._tasks = [];

        const dataListMapByActionId = {};
        for( let task of batch ) {
            const actionId = task.actionId;
            let dataList = dataListMapByActionId[actionId];
            if( !dataList ) dataListMapByActionId[actionId] = dataList = [];
            dataList.push(task.data);
        }

        const ctx = new InternalContext();

        for( let actionId in dataListMapByActionId ) {
            const action = this._actions[actionId];
            if( !action ) {
                this.logger.warn( 'no action registered on ' + actionId );
                continue;
            }

            const dataList = dataListMapByActionId[actionId];

            action( ctx, dataList, actionId )
            .catch( err => {
                this.logger.error( {ctx, err}, 'failed to call action' );
            } );
        }
    }


    on( actionId, action ) {
        this._actions[actionId] = action;
    }


    _put( ctx, actionId, data ) {
        this._tasks.push( {actionId, data} );
    }


    put( ctx, actionId, data ) {
        this._put( ctx, actionId, data );
        return Promise.resolve();
    }


    putArray( ctx, actionId, dataList ) {
        for( let data of dataList ) {
            this._put( ctx, actionId, data );
        }
        return Promise.resolve();
    }


}

