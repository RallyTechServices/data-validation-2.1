Ext.define('CA.techservices.validation.StoryMissingRelease',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_missingrelease',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        canceledState: "Canceled",
        scheduleStates: null,
        model: 'HierarchicalRequirement',
        label: 'Stories "in progress" or beyond with missing "Release" tag',
        description: 'Stories "in progress" or beyond with missing "Release" tag'
    },
    getFilters: function() {
        return Rally.data.wsapi.Filter.and([{
            property:'ScheduleState',
            operator:'>',
            value: "Defined"
        },{
            property:'Release',
            value: ""
        },{
            property:'Feature.State',
            operator:'!=',
            value: "Canceled"
        }]);
    }
});