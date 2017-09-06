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
        label: '{0}s with incorrect "Project" field value --> should be "Portfolio" or Program" or "Sub-Program"',
        description: '{0}s with incorrect "Project" field value --> should be "Portfolio" or "Program" or "Sub-Program"'
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
    apply: function(pg, baseFilters){
        //console.log('filters to string', this.getFilters().toString());
        var filters = this.getFilters();
        if (baseFilters){
            filters = filters.and(baseFilters);
        }

        var deliveryFilters = [{
            property: "Project.Name",
            operator: '!contains',
            value: 'Portfolio'
        },{
            property: "Project.Name",
            operator: '!contains',
            value: 'Program'
        },
        {
            property: "Project.Name",
            operator: '!contains',
            value: 'Sub-Program'
        }
        ];

        filters = filters.and(Rally.data.wsapi.Filter.and(deliveryFilters));

        var deferred = Ext.create('Deft.Deferred'),
            executionConfig = {
                model: this.getModel(),
                filters: filters,
                context: {project: pg._ref, projectScopeDown: true}
            };

        this._loadWsapiRecords(executionConfig).then({
            success: function(records){
                deferred.resolve(records);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred.promise;
    }
});