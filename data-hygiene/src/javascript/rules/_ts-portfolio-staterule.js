Ext.define('CA.techservices.validation.PortfolioStateRule',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_staterelease',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        targetPortfolioLevel: 0,
        executionState: "Execution",

        label: '{0} in "Execution" State missing Release',
        description: '{0} in "Execution" State missing Release'
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getLabel: function(){
        return Ext.String.format(this.label, this.portfolioItemTypes[this.targetPortfolioLevel].Name);
    },
    getFilters: function(){
        var executionState = this.executionState,
            filters = [{
            property: 'State.Name',
            value: executionState
        },{
            property: 'Release',
            value: ""
        }];
        return Rally.data.wsapi.Filter.and(filters);
    }
});