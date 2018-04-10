Ext.define('CA.techservices.validation.CanceledParent',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_parent-canceled',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
//        canceledState: "Canceled",
        model: 'HierarchicalRequirement',
        portfolioItemTypes: null,
        label: 'Stories parented to a Canceled {0}'
    },
    getLabel: function(){
        var msg = Ext.String.format(
            this.label,
            this.portfolioItemTypes[0].Name
        );
        return msg;
    },
    getFilters: function() {
        return Rally.data.wsapi.Filter.and([{
            property:'Feature.State',
            operator: "=",
            value: "Canceled"
        }]);
    }
});