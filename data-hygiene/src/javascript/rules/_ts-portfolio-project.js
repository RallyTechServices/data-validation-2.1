Ext.define('CA.techservices.validation.PortfolioProject',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_project',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        targetPortfolioLevel: 0,
        portfolioProjects: [],
        label: '{0}s with incorrect "Project" field value --> should be "Portfolio" or "Sub-Portfolio"',
        description: '{0}s with incorrect "Project" field value --> should be "Portfolio" or "Sub-Portfolio"'
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getLabel: function(){
        this.label = Ext.String.format(
           this.label,
            /[^\/]*$/.exec(this.portfolioItemTypes[this.targetPortfolioLevel].Name)
        );
        return this.label;
    },
    apply: function(pg){
        console.log('filters to string', this.getFilters().toString());
        var deferred = Ext.create('Deft.Deferred'),
            executionConfig = {
                model: this.getModel(),
                filters: this.getFilters(),
                context: {project: pg.executionProjectRef}
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
    }
});