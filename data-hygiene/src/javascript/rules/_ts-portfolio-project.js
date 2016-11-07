Ext.define('CA.techservices.validation.PortfolioProject',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_project',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        targetPortfolioLevel: 0,
        portfolioProjects: [],
        label: '{0}s with incorrect "Project" field value --> should be "Portfolio" or "Sub-Portfolio"',
        description: '{0}s with incorrect "Project" field value --> should be "Portfolio" or "Sub-Portfolio"'
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getDescription: function() {
        var msg = Ext.String.format(
            this.description,
            /[^\/]*$/.exec(this.portfolioItemTypes[this.targetPortfolioLevel].Name)
        );
        return msg;
    },
    getFetchFields: function() {
        return ['Name','Project'];
    },
    getLabel: function(){
        this.label = Ext.String.format(
           this.label,
            /[^\/]*$/.exec(this.portfolioItemTypes[this.targetPortfolioLevel].Name)
        );
        return this.label;
    },
    applyRuleToRecord: function(record) {
        if ( !Ext.Array.contains(this.portfolioProjects, record.get('Project').ObjectID )) {
            return this.getDescription();
        } else {
            return null; // no rule violation
        }
    }
});