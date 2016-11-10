Ext.define('CA.techservices.validation.LeafNodeStories',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsrule_leafnodestories',

    /**
     *
     *  LeafNodeStories
     *
     *  Rule Criteria:
     *
     *  Build Percent for team is >0or Null.
     *  Parent Initiative has an Investment Category of "Build"
     *  Parent Initiative state is "In-Progress" or "Staging"
     *  Story state is in "Defined", "In-Progress" or "Complete"
     *  Story is in a Project Leaf Node
     *
     *
     */
    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        model: 'HierarchicalRequirement',

        portfolioItemTypes: null,

        label: 'User Stories not in a delivery (Leaf Node) team',
        description: 'Build Percent for team is >0or Null. ' +
        'Parent Initiative has an Investment Category of "Build" ' +
        'Parent Initiative state is "In-Progress" or "Staging" ' +
        'Story state is in "Defined", "In-Progress" or "Complete" ' +
        'Story is in a team that is not a leaf node',
        buildPercentField: 'c_BuildPercent',
        initiativeStates: ["In-Progress","Staging"],
        initiativeInvestmentCategories: ["Build"],
        stateField: "ScheduleState",
        stateIsIn: ["Defined","In-Progress","Completed"],
    },
    getFetchFields: function() {
        return ['FormattedID','Name',this.getFeatureName(),'InvestmentCategory','ScheduleState','Project', 'PlanEstimate'];
        return ['FormattedID','Name',this.getFeatureName(),'Parent','InvestmentCategory','State','ScheduleState','Project', this.buildPercentField, 'PlanEstimate'];
    },
    getDetailFetchFields: function(){
        return ['FormattedID','Name',this.getFeatureName(),'InvestmentCategory','ScheduleState','Project', 'PlanEstimate'];
    },
    getFeatureName: function(){
        return this.portfolioItemTypes[0].TypePath.replace('PortfolioItem/','');
    },
    applyRuleToRecord: function(record) {
        var recData = record.getData(),
            initiative = recData[this.getFeatureName()] && recData[this.getFeatureName()].Parent,
            project = recData.Project.ObjectID;

        if (initiative &&
            (Ext.Array.contains(this.stateIsIn), recData.ScheduleState) &&
            (recData.Project[this.buildPercentField] !== 0) &&
            (Ext.Array.contains(this.initiativeInvestmentCategories, initiative.InvestmentCategory)) &&
            (initiative.State && initiative.State.Name &&
            Ext.Array.contains(this.initiativeStates, initiative.State.Name)) &&
            !this.projectUtility.isProjectLeafNode(project)){

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
        // Project is not in a leaf node project

        var otherFilters = Rally.data.wsapi.Filter.and([{
            property: this.getFeatureName() + '.Parent.InvestmentCategory',
            value: "Build"
        },{
            property: 'Project.Children.State',
            value: "Open"
        },{
            property: 'Project.' + this.buildPercentField,
            operator: '!=',
            value: 0
        }]);

        return filters.and(otherFilters);
    }
});