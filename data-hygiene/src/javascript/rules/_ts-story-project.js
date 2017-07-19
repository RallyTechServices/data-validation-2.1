Ext.define('CA.techservices.validation.StoryProject',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_project',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        model: 'HierarchicalRequirement',
        label: 'Stories with incorrect "Project" field value --> should be "Team"',
        description: 'Stories with incorrect "Project" field value --> should be "Team"'
    },
    getFetchFields: function() {
        return ['Name','Project'];
    },
    apply: function(pg, baseFilters){
        var filters = this.getFilters();
        if (baseFilters){
            filters = filters.and(baseFilters);
        }

        var deliveryFilters = filters.and({
            property: "Project.Name",
            operator: '!contains',
            value: 'Team'
        });
        var deferred = Ext.create('Deft.Deferred'),
            executionConfig = {
                model: this.getModel(),
                filters: deliveryFilters,
                context: {project: pg._ref, projectScopeDown: true}
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