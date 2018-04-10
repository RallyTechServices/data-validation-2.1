Ext.define('CA.techservices.validation.PortfolioNotExecutedInProgress',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_notexecutedinprogress',


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

        label: '{0}s not yet in "{1}" State with stories "In-Progress" or beyond',
        description: '{0}s not yet in "{1}" State with stories "In-Progress" or beyond'
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getLabel: function(){
        return Ext.String.format(this.label, this.portfolioItemTypes[this.targetPortfolioLevel].Name, this.executionState);
    },
    getFilters: function(){
        var filters = [{
            property: 'State',
            value: null
        }],
            piName = this.portfolioItemTypes[this.targetPortfolioLevel].TypePath,
            states = this.portfolioItemStates[piName];

        Ext.Array.each(states, function(state){
            if (state === this.executionState || state === this.canceledState){
                return false;
            }
            filters.push({
                property: 'State.Name',
                value: state
            });
        }, this);

        if (filters.length > 1){
            filters = Rally.data.wsapi.Filter.or(filters);
            filters = filters.and({
                property: 'ActualStartDate',
                operator: '>',
                value: '1990-01-01'
            });
        } else {
            filters.push({
                property: 'ActualStartDate',
                operator: '>',
                value: '1990-01-01'
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