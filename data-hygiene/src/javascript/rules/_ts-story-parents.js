Ext.define('CA.techservices.validation.StoryParents',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_parents',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        model: 'HierarchicalRequirement',
        portfolioItemTypes: null,

        label: 'Parent Stories (Stories with Child Stories)'
    },
    getFilters: function() {
        return Rally.data.wsapi.Filter.and([{
            property:'Children.ObjectID',
            operator:'!=',
            value:null
        }]);
    }
});