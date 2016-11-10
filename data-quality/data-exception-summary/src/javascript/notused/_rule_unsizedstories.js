Ext.define('CA.techservices.validation.UnsizedStories',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsrule_unsizedstories',

    /**
     *
     *  UnsizedStories
     *
     *  Rule Criteria:
     *
     *  Build Percent for team is >0or Null.
     *  Parent Initiative has an Investment Category of "Build"
     *  Parent Initiative state is "In-Progress" or "Staging"
     *  Story state is in "Defined", "In-Progress" or "Complete"
     *  Story Size is null
     *
     */


    query: '(((Project.c_BuildPercent != 0) AND (Parent.InvestmentCategory = "Build")) AND ((((ScheduleState = "Defined") OR (ScheduleState = "In-Progress")) OR)',
    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        model: 'HierarchicalRequirement',

        portfolioItemTypes: null,

        label: 'Unsized User Stories',
        description: 'Build Percent for team is >0or Null. ' +
                'Parent Initiative has an Investment Category of "Build" ' +
                'Parent Initiative state is "In-Progress" or "Staging" ' +
                'Story state is in "Defined", "In-Progress" or "Complete" ' +
                'Story Size is null ',
        buildPercentField: 'c_BuildPercent',
        initiativeStates: ["In-Progress","Staging"],
        initiativeInvestmentCategories: ["Build"],
        stateField: "ScheduleState",
        stateIsIn: ["Defined","In-Progress","Completed"],
    },
    getFetchFields: function() {
        return ['ObjectID','Name',this.getFeatureName(),'Parent','InvestmentCategory','State','ScheduleState','Project', this.buildPercentField, 'PlanEstimate'];
    },
    getDetailFetchFields: function() {
        return ['FormattedID','Name', 'PlanEstimate',this.getFeatureName(),'ScheduleState','Project'];
    },
    applyRuleToRecord: function(record) {
        var recData = record.getData(),
            initiative = recData[this.getFeatureName()] && recData[this.getFeatureName()].Parent;

        if (initiative &&
            (!recData.PlanEstimate && recData.PlanEstimate !== 0) &&
            (Ext.Array.contains(this.stateIsIn), recData.ScheduleState) &&
            (recData.Project[this.buildPercentField] !== 0) &&
            (Ext.Array.contains(this.initiativeInvestmentCategories, initiative.InvestmentCategory)) &&
            (initiative.State && initiative.State.Name &&
                Ext.Array.contains(this.initiativeStates, initiative.State.Name))){

            return this.getDescription();
        }
        return null; // no rule violation
    },
    getFilters: function(){
        /**
         *  Rule Criteria:
         *
         *  Build Percent for team is >0or Null.
         *  Parent Initiative has an Investment Category of "Build"
         *  Parent Initiative state is "In-Progress" or "Staging"
         *  Story state is in "Defined", "In-Progress" or "Complete"
         *  Story Size is null
         *
         */

        //Parent Initiative state is "In-Progress" or "Staging"
        var intiativeStateCriteria = [{
            property: this.getFeatureName() + ".Parent.State.Name",
            value: "In-Progress"
        },{
            property: this.getFeatureName() + ".Parent.State.Name",
            value: "Staging"
        }];
        intiativeStateCriteria = Rally.data.wsapi.Filter.or(intiativeStateCriteria);

        //Story state is in "Defined", "In-Progress" or "Complete"
        var storyStateCriteria = [{
            property: 'ScheduleState',
            value: 'Defined'
        },{
            property: 'ScheduleState',
            value: 'In-Progress'
        },{
            property: 'ScheduleState',
            value: 'Completed'
        }];
        storyStateCriteria = Rally.data.wsapi.Filter.or(storyStateCriteria);

        var filters = intiativeStateCriteria.and(storyStateCriteria);

        // Build Percent for team is >0or Null.
        // Parent Initiative has an Investment Category of "Build"
        // Story Size is null
        var otherFilters = Rally.data.wsapi.Filter.and([{
            property: this.getFeatureName() + '.Parent.InvestmentCategory',
            value: "Build"
        },{
            property: 'PlanEstimate',
            value: ""
        },{
            property: 'Project.' + this.buildPercentField,
            operator: '!=',
            value: 0
        }]);

        return filters.and(otherFilters);
    }
});