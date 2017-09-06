Ext.define('CA.techservices.validation.StoryChildren',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_children',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        model: 'HierarchicalRequirement',
        portfolioItemTypes: null,

        label: 'Child Stories (Stories nested under other Stories)'
    },
    getFilters: function() {
        return Rally.data.wsapi.Filter.and([{
            property:'Parent',
            operator:'!=',
            value:null
        },{
            property: 'PortfolioItem',
            value: null
        }]);
    }
});