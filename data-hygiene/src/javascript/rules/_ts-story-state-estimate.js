Ext.define('CA.techservices.validation.StoryPlanEstimate',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_planestimate',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        scheduleStates: null,
        model: 'HierarchicalRequirement',
        label: 'Stories "in progress" or beyond, without estimates',
        description: 'Stories "in progress" or beyond, without estimates'
    },
    getFilters: function() {
        return Rally.data.wsapi.Filter.and([{
            property:'ScheduleState',
            operator:'>',
            value: "Defined"
        },{
            property:'PlanEstimate',
            value: ""
        }]);
    }
});