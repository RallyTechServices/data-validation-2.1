Ext.define('CA.techservices.validation.BaseRule',{
    extend: 'Ext.Base',
    /*
     * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
     * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
     */
    portfolioItemTypes:[],
    /**
     *
     * @cfg
     * {String} model The name of a record type that this rule applies to
     */
    model: null,
    /**
     *
     * @cfg {String} a human-readable label for the chart that will be made from the rule
     */
    label: 'No label supplied for this rule',

    constructor: function(config) {
        Ext.apply(this,config);
    },
    getDescription: function() {
        return this.description || this.getLabel();
    },

    getFetchFields: function() {
        return [];
    },
    getLabel: function() {
        //console.error('getLabel is not implemented in subclass ', this.self.getName());
        return this.label;
    },
    getModel: function() {
        return this.model;
    },

    getFilters: function() {
        return Ext.create('Rally.data.wsapi.Filter', {
            property:'ObjectID',
            operator:'>',
            value: 0
        });
    },
    _getFeatureName: function(){
       // return "Feature";
        return this.portfolioItemTypes[0].TypePath.replace('PortfolioItem/','');
    },
    getUserFriendlyRuleLabel: function() {
        return this.getLabel();
    },
    apply: function(pg, baseFilters){

        var filters = this.getFilters();
        if (baseFilters){
            filters = filters.and(baseFilters);
        }
        console.log('apply.label:', this.getLabel());
        console.log('apply.filters', this.getFilters().toString(), filters.toString(), baseFilters && baseFilters.toString());

        var deferred = Ext.create('Deft.Deferred'),
            strategyConfig = {
                model: this.getModel(),
                filters: filters,
                context: {project: pg._ref, projectScopeDown: true}
            };
            //,
            // executionConfig = {
            //     model: this.getModel(),
            //     filters: filters,
            //     context: {project: pg.executionProjectRef, projectScopeDown: true}
            // };

        // Deft.Promise.all([
        //     this._loadWsapiRecords(strategyConfig),
        //     // this._loadWsapiRecords(executionConfig)
        // ]).then({
       
        this._loadWsapiRecords(strategyConfig).then({            
            success: function(results){
                // deferred.resolve(Ext.Array.sum(results));
                deferred.resolve(results);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred.promise;
    },

    _loadWsapiCount: function(config){
        var deferred = Ext.create('Deft.Deferred');

        config.pageSize = 1;
        config.limit = 1;
        config.fetch = ['ObjectID'];

        console.log('_loadWsapiCount', config);
        Ext.create('Rally.data.wsapi.Store',config).load({
            callback: function(records, operation){
                console.log('_loadWsapiCount callback', records, operation);
                if (operation.wasSuccessful()){
                    deferred.resolve(operation.resultSet.totalRecords);
                } else {
                    deferred.reject(operation.error.errors.join(','));
                }
            }
        });
        return deferred.promise;
    },
    _loadWsapiRecords: function(config) {
        var deferred = Ext.create('Deft.Deferred');

        if (!config.pageSize){
            config.pageSize = 2000;
        }
        config.limit = Infinity;
        console.log('_loadWsapiRecords', config);
        Ext.create('Rally.data.wsapi.Store',config).load({
            callback: function(records, operation){
                console.log('_loadWsapiRecords callback', records, operation);
                if (operation.wasSuccessful()){
                    deferred.resolve(records);
                } else {
                    deferred.reject(operation.error.errors.join(','));
                }
            }
        });
        return deferred.promise;
    }
});