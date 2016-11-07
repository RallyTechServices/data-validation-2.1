Ext.define('CA.techservices.validation.StoryProject',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_project',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        model: 'HierarchicalRequirement',
        label: 'User Stories with incorrect "Project" field value --> should be "Team"',
        description: 'User Stories with incorrect "Project" field value --> should be "Team"'
    },
    getFetchFields: function() {
        return ['Name','Project'];
    },
    applyRuleToRecord: function(record) {
        if ( !Ext.Array.contains(this.storyProjects, record.get('Project').ObjectID )) {
            return this.getDescription();
        } else {
            return null; // no rule violation
        }
    }
});