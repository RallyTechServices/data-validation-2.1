Ext.define('CA.techservices.validation.UserStoryOrphan',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsrule_userstoryorphan',

/**
 *
 *  UserStoryOrphan
 *
 *  Rule Criteria:
 *
 *  Story Type is "Standard" or Null
 *  Build Percent for team is > 0 or Null
 *  Story state has left "Unelaborated"
 *  Story has no parent
 *
 */
    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        model: 'HierarchicalRequirement',

        label: 'Orphaned User Stories',
        description: 'Story Type is "Standard" or null, Build Percent for team > 0, Story State > "Unelaborated" and Story has no Parent',

        buildPercentField: 'c_BuildPercent',
        storyTypeField: 'c_StoryType',
        storyTypeValues: ["Standard"],
        stateField: "ScheduleState",
        notInState: "Unelaborated",
    },
    getFetchFields: function() {
        return ['FormattedID','Name',this.getFeatureName(),'ScheduleState','Project', this.storyTypeField];
        return ['FormattedID','Name','Parent','PortfolioItem','ScheduleState','Project',this.buildPercentField, this.storyTypeField];
    },
    applyRuleToRecord: function(record) {
        if (!record.get(this.storyTypeField) || Ext.Array.contains(this.storyTypeValues, record.get(this.storyTypeField))){
            var state = record.get(this.stateField),
                parent = record.get("Parent") || record.get('PortfolioItem') || null,
                buildPercent = record.get('Project') && record.get('Project')[this.buildPercentField] || 0;

            if (buildPercent > 0 && state !== this.notInState && !parent){
                return this.getDescription();
            }
        }
        return null; // no rule violation
    },
    getFilters: function(){

        /**
         *  Rule Criteria:
         *
         *  Story Type is "Standard" or Null
         *  Build Percent for team is > 0 or Null
         *  Story state has left "Unelaborated"
         *  Story has no parent
         *
         */

        var storyTypeFilters = Ext.Array.map(this.storyTypeValues, function(v){
            return {
                property: this.storyTypeField,
                value: v
            };
        }, this);

        storyTypeFilters.push({
            property: this.storyTypeField,
            value: ""
        });

        var filters = Rally.data.wsapi.Filter.or(storyTypeFilters);

        var otherFilters = Rally.data.wsapi.Filter.and([{
            property: this.getFeatureName(),
            value: null
        },{
            property: 'ScheduleState',
            operator: '>',
            value: this.notInState
        },{
            property: 'Project.' + this.buildPercentField,
            operator: '!=',
            value: 0
        }]);

        return filters.and(otherFilters);
    }
});