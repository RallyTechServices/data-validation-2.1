Ext.define('CA.techservices.validation.PortfolioStateRule',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_staterelease',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        targetPortfolioLevel: 0,

        label: '{0} in "Execution" State missing Release',
        description: '{0} in "Execution" State missing Release'
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getDescription: function() {
       return Ext.String.format(this.description, this.portfolioItemTypes[this.targetPortfolioLevel].Name);
    },
    getFetchFields: function() {
        return ['State','Release']; //:summary[State]'];
    },
    getLabel: function(){
        return Ext.String.format(this.label, this.portfolioItemTypes[this.targetPortfolioLevel].Name);
    },
    applyRuleToRecord: function(record) {
        if ( true ) {
            return this.getDescription();
        } else {
            return null; // no rule violation
        }
    }
});