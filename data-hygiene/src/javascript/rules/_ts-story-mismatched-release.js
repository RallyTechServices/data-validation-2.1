Ext.define('CA.techservices.validation.StoryMismatchedRelease',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_mismatchedrelease',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        scheduleStates: null,
        model: 'HierarchicalRequirement',
        label: 'Stories with incorrect "Release" tag (does not match parent {0})',
        description: 'Stories with incorrect "Release" tag (does not match parent {0})'
    },
    getLabel: function(){
        return Ext.String.format(this.label, this.portfolioItemTypes[0].Name);
    },
    apply: function(pg, baseFilters){

        var filters = this.getFilters();
        if (baseFilters){
            filters= filters.and(baseFilters);
        }

        var deferred = Ext.create('Deft.Deferred'),
            featureName = this._getFeatureName(),
            strategyConfig = {
                model: this.getModel(),
                filters: filters,
                fetch: ['FormattedID','Owner','Release','Name',featureName],
                compact: false,
                context: {project: pg._ref, projectScopeDown: true}
            };
            // executionConfig = {
            //     model: this.getModel(),
            //     filters: filters,
            //     fetch: ['Release','Name',featureName],
            //     compact: false,
            //     context: {project: pg.executionProjectRef, projectScopeDown: true}
            // };

        // Deft.Promise.all([
        //     this._loadWsapiRecords(strategyConfig),
        //     //this._loadWsapiRecords(executionConfig)
        // ]).then({
        this._loadWsapiRecords(strategyConfig).then({
            success: function(results){
                var filtered_records = [];
                var records = _.flatten(results),
                    count = 0;
                Ext.Array.each(records, function(r){
                    var release = r.get('Release') && r.get('Release').Name || null,
                        featureRelease = r.get(featureName) && r.get(featureName).Release && r.get(featureName).Release.Name || null;
                    if (release != featureRelease){
                        filtered_records.push(r);
                        count++;
                    }
                });
                deferred.resolve(filtered_records);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred.promise;
    },
    getFilters: function() {
        var andFilters =  Rally.data.wsapi.Filter.and([{
            property: this._getFeatureName() + '.ObjectID',
            operator: '>',
            value: 0
        },{
            property: 'DirectChildrenCount',
            value: 0
        }]);
        return andFilters; //.and(orFilters);
    }
});