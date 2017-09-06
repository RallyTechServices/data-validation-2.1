Ext.define('CA.techservices.validation.StoryProjectTrack',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_project_track',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        model: 'HierarchicalRequirement',
        label: 'Stories with Project field value "Track"',
        description: 'Stories with Project field value "Track"'
    },
    getFetchFields: function() {
        return ['FormattedID','Name','Project','Owner','Feature','State'];
    },
    apply: function(pg, baseFilters){
        var filters = this.getFilters();
        if (baseFilters){
            filters = filters.and(baseFilters);
        }

        var deliveryFilters = filters.and({
            property: "Project.Name",
            operator: 'contains',
            value: 'Track'
        });
        
        var deferred = Ext.create('Deft.Deferred'),
            executionConfig = {
                model: this.getModel(),
                filters: deliveryFilters,
                context: {project: pg._ref, projectScopeDown: true},
                fetch: this.getFetchFields()
            };
            // ,
            // deliveryConfig = {
            //     model: this.getModel(),
            //     filters: deliveryFilters,
            //     context: {project: pg.executionProjectRef, projectScopeDown: true}
            // };

        // var promises = [
        //     this._loadWsapiRecords(executionConfig),
        //     // this._loadWsapiRecords(deliveryConfig)
        // ];

        // Deft.Promise.all(promises).then({
        this._loadWsapiRecords(executionConfig).then({
            success: function(results){
                console.log('results', results);
                //deferred.resolve(Ext.Array.sum(results));
                deferred.resolve(results);
            },
            failure: function(msg){
                deferred.reject(msg);
            },
            scope: this
        });
        return deferred.promise;
    },
    getFilters: function(){
        return Rally.data.wsapi.Filter.fromQueryString("(ObjectID > 0)");
    }
});