Ext.define('CA.techservices.validation.StoryMissingRelease',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_missingrelease',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        scheduleStates: null,
        model: 'HierarchicalRequirement',
        label: 'Stories "in progress" or beyond, with missing "Release" tag',
        description: 'Stories "in progress" or beyond, with missing "Release" tag'
    },
    getFetchFields: function() {
        return ['ScheduleState','Release'];
    },
    applyRuleToRecord: function(record) {

        var idx = _.indexOf(this.scheduleStates, record.get('ScheduleState'));
        if (idx >= _.indexOf(this.scheduleStates, "In-Progress")){
            if (!record.get('Release')) {
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
            property:'Release',
            value: ""
        }]);
    }
});