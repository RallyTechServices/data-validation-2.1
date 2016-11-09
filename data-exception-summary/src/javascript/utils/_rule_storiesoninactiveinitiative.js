Ext.define('CA.techservices.validation.ActiveStoriesInactiveInitiative',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsrule_activestoriesinactiveinitiative',

    /**
     * Build Percent for team is >0or Null.
     * Parent Initiative has an Investment Category of "Build"
     * Parent Initiative state is NOT "In-Progress" or "Staging"
     * Stories state is "Defined", "In-Progress", or "Complete"
     * Story type is "Standard" or Null
     **/

    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        model: 'HierarchicalRequirement',

        label: 'Active Stories on Inactive {0}',
        description: 'Active Stories on Inactive {0}:<br/>Build Percent for team is >0 or Null.<br/>' +
                     'Parent {0} has an Investment Category of "Build"<br/>' +
                     'Parent {0} state is NOT "In-Progress" or "Staging"<br/>' +
                     'Story state is "Defined", "In-Progress", or "Complete"<br/>' +
                     'Story type is "Standard" or Null<br/>',
        storyTypeField: 'c_StoryType',
        buildPercentField: 'c_BuildPercent'
    },

    getDescription: function() {
        var msg = Ext.String.format(
            this.description,
            this.portfolioItemTypes[1].Name
        );
        return msg;
    },
    getFetchFields: function() {
        return ['ObjectID','Name',this.getFeatureName(),'Parent','InvestmentCategory','State','ScheduleState','Project', this.buildPercentField, 'PlanEstimate'];
    },
    getDetailFetchFields: function() {
        return ['FormattedID','Name',this.getFeatureName(),'ScheduleState','Project'];
    },
    getLabel: function(){
        var msg = Ext.String.format(
            this.label,
            this.portfolioItemTypes[1].Name
        );
        return msg;
    },
    applyRuleToRecord: function(record) {
        if ( !record.get('Parent') && record.get(this.criteriaField) === this.criteriaValue ) {
            return this.getDescription();
        } else {
            return null; // no rule violation
        }
    },
    getFilters: function(){
        /**
         *  Rule Criteria:
         *
         * Build Percent for team is >0or Null.
         * Parent Initiative has an Investment Category of "Build"
         * Parent Initiative state is NOT "In-Progress" or "Staging"
         * Stories state is "Defined", "In-Progress", or "Complete"
         * Story type is "Standard" or Null
         *
         */

        //Parent Initiative state is NOT "In-Progress" or "Staging"
        var intiativeStateCriteria = [{
            property: this.getFeatureName() + ".Parent.State.Name",
            operator: '!=',
            value: "In-Progress"
        },{
            property: this.getFeatureName() + ".Parent.State.Name",
            operator: '!=',
            value: "Staging"
        }];
        intiativeStateCriteria = Rally.data.wsapi.Filter.and(intiativeStateCriteria);

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
        console.log('filters+initativeStatecriteria', filters.toString());

        var storyTypeCriteria = [{
            property: this.storyTypeField,
            value: "Standard"
        },{
            property: this.storyTypeField,
            value: ""
        }];
        storyTypeCriteria = Rally.data.wsapi.Filter.or(storyTypeCriteria);
        console.log('storyTypeCriteria', storyTypeCriteria.toString());

        filters = filters.and(storyTypeCriteria);
        console.log('filters1', filters.toString());

        // Build Percent for team is >0or Null.
        // Parent Initiative has an Investment Category of "Build"
        // Story Size is null
        var otherFilters = Rally.data.wsapi.Filter.and([{
            property: this.getFeatureName() + '.Parent.InvestmentCategory',
            value: "Build"
        },{
            property: 'Project.' + this.buildPercentField,
            operator: '!=',
            value: 0
        }]);
        console.log('filters', filters.toString());
        return filters.and(otherFilters);
    }
});