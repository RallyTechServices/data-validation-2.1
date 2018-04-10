Ext.define('CA.techservices.validation.PortfolioStateRule',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_staterelease',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        portfolioItemStates: [],
        targetPortfolioLevel: 0,
        executionState: "Execution",
        canceledState: "Canceled",

        label: '{0} in "{1}" State or beyond missing Release',
        description: '{0} in "{1}" State or beyond missing Release'
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getLabel: function(){
        return Ext.String.format(this.label, this.portfolioItemTypes[this.targetPortfolioLevel].Name, this.executionState);
    },
    getFilters: function(){
        var filters = [],
            piName = this.portfolioItemTypes[this.targetPortfolioLevel].TypePath,
            states = this.portfolioItemStates[piName];
        Ext.Array.each(states, function(state){
            if (state === this.canceledState){
                return false;
            }
            if (state === this.executionState || filters.length > 0){
                filters.push({
                    property: 'State.Name',
                    value: state
                });
            }
        }, this);

        if (filters.length > 1){
            filters = Rally.data.wsapi.Filter.or(filters);
            filters = filters.and({
                property: 'Release',
                value: ""
            });
        } else {
            filters.push({
                property: 'Release',
                value: ""
            });
            filters = Rally.data.wsapi.Filter.and(filters);
        }

        return filters;

        //var executionState = this.executionState,
        //    filters = [{
        //    property: 'State.Name',
        //    value: executionState
        //},{
        //    property: 'Release',
        //    value: ""
        //}];
        //return Rally.data.wsapi.Filter.and(filters);
    }
});