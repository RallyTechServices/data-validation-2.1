Ext.define('CA.techservices.validation.PortfolioStateNoStories',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_statenostories',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        portfolioItemStates: [],
        targetPortfolioLevel: 0,
        triggerState: "Planning",
        canceledState: "Canceled",

        label: '{0} in "{1}" State or beyond with no child stories',
        description: '{0} in "{1}" State or beyond with no child stories'
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getLabel: function(){
        return Ext.String.format(this.label, this.portfolioItemTypes[this.targetPortfolioLevel].Name, this.triggerState);
    },
    getFilters: function(){
        var filters = [],
            piName = this.portfolioItemTypes[this.targetPortfolioLevel].TypePath,
            states = this.portfolioItemStates[piName];
        Ext.Array.each(states, function(state){
            if (state === this.canceledState){
                return false;
            }
            if (state === this.triggerState || filters.length > 0){
                filters.push({
                    property: 'State.Name',
                    value: state
                });
            }
        }, this);

        if (filters.length > 1){
            filters = Rally.data.wsapi.Filter.or(filters);
            filters = filters.and({
                property: 'LeafStoryCount',
                value: 0
            });
        } else {
            filters.push({
                property: 'LeafStoryCount',
                value: 0
            });
            filters = Rally.data.wsapi.Filter.and(filters);
        }

        return filters;
    }
});