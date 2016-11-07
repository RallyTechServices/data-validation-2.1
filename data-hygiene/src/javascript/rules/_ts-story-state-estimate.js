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
        label: 'User Stories "in progress" or beyond, without estimates',
        description: 'User Stories "in progress" or beyond, without estimates'
    },
    getFetchFields: function() {
        return ['ScheduleState','PlanEstimate'];
    },
    applyRuleToRecord: function(record) {

        var idx = _.indexOf(this.scheduleStates, record.get('ScheduleState'));
        if (idx >= _.indexOf(this.scheduleStates, "In-Progress")){
            if (!record.get('PlanEstimate') && record.get('PlanEstimate')!== 0) {
                return this.getDescription();
            }
        }
        return null; // no rule violation
    },
    getFilters: function() {
        return Rally.data.wsapi.Filter.and([{
            property:'ScheduleState',
            operator:'>',
            value: "In-Progress"
        },{
            property:'PlanEstimate',
            value: ""
        }]);
    }
});