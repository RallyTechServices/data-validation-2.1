Ext.define('CA.techservices.validation.PortfolioChildState',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_childstate',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        targetPortfolioLevel: 1,

        label: '{0}s in "No Entry” state with {1}s in "Front Door" state or beyond',
        description: '{0}s in "No Entry” state with {1}s in "Front Door" state or beyond'
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getLabel: function(){
        this.label = Ext.String.format(
            this.label,
            /[^\/]*$/.exec(this.portfolioItemTypes[this.targetPortfolioLevel].Name),
            /[^\/]*$/.exec(this.portfolioItemTypes[this.targetPortfolioLevel - 1].Name)
        );
        return this.label;
    },
    getFilters: function(){
        var childFilters = [],
            childStates = this.portfolioItemStates[this.portfolioItemTypes[0].TypePath];
        console.log('state', childStates, this.portfolioItemStates);
        var noEntryState = "No Entry",
            filters = [{
            property: 'State.Name',
            value: noEntryState
        },{
            property: 'State',
            value: ''
        }];
        filters = Rally.data.wsapi.Filter.or(filters);


        Ext.Array.each(childStates, function(state){

            if (state !== noEntryState){
                childFilters.push({
                    property: 'Children.State.Name',
                    value: state
                });
            }
        });
        childFilters = Rally.data.wsapi.Filter.or(childFilters);
        return filters.and(childFilters);
    }
});