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
        label: 'User Stories with incorrect "Project" field value --> should be "Team"',
        description: 'User Stories with incorrect "Project" field value --> should be "Team"'
    },
    getFetchFields: function() {
        return ['Name','Project'];
    },
    apply: function(pg){

        var deferred = Ext.create('Deft.Deferred'),
            executionConfig = {
                model: this.getModel(),
                filters: this.getFilters(),
                context: {project: pg.strategyProjectRef}
            };

        this._loadWsapiCount(executionConfig).then({
            success: function(count){
                deferred.resolve(count);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred.promise;
    },
    getFilters: function(){
        return Rally.data.wsapi.Filter.fromQueryString("(ObjectID > 0)");
    }
});