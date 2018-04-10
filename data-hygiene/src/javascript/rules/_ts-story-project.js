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
        label: 'Stories with incorrect "Project" field value --> should be "Team" or "Track"',
        description: 'Stories with incorrect "Project" field value --> should be "Team" or "Track"'
    },
    getFetchFields: function() {
        return ['Name','Project','Feature'];
    },
    apply: function(pg, baseFilters){
        var filters = this.getFilters();
        if (baseFilters){
            filters = filters.and(baseFilters);
        }

        var deliveryFilters = [{
            property: "Project.Name",
            operator: '!contains',
            value: 'Team'
        },{
            property: "Project.Name",
            operator: '!contains',
            value: 'Track'
/*
        },{
            property: "Feature.State",
            operator: '!=',
            value: 'Ideation'
        },{
            property: "Feature.State",
            operator: '!=',
            value: 'Front Door'
        },{
            property: "Feature.State",
            operator: '!=',
            value: 'Grooming'
        },{
            property: "Feature.State",
            operator: '!=',
            value: 'Canceled'
        },{
            property: "Feature.State",
            operator: '!=',
            value: ''
*/
        }];

// (((((State != "Ideation") AND (State != "Front Door")) AND (State != "Grooming")) AND (State != "Canceled")) AND (State != ""))
// ((((State = "Planning") OR (State = "Execution")) OR (State = "Certification")) OR (State = "Production"))

        filters = filters.and(Rally.data.wsapi.Filter.and(deliveryFilters));

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