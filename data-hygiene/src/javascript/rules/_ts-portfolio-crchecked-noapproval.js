Ext.define('CA.techservices.validation.PortfolioCRCheckedNoApproval',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_crcheckednoapproval',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        crField: null,
        crApprovalField: null,
        portfolioItemTypes:[],
        portfolioItemStates: [],
        targetPortfolioLevel: 0,
        executionState: "Execution",
        canceledState: "Canceled",

        label: '{0} in "{1}" State or beyond with CR Checked and no CR Approved Date',
        description: '{0} in "{1}" State or beyond with CR Checked and no CR Approved Date'
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


        var crFilters = Rally.data.wsapi.Filter.and([{
            property: this.crField,
            value: true
        },{
            property: this.crApprovalField,
            value: "null"
        }]);

        if (filters.length > 1){
            filters = Rally.data.wsapi.Filter.or(filters);
            filters = filters.and(crFilters);
        } else {
            filters = crFilters.and(filters);
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