Ext.define('CA.techservices.validation.PortfolioChildState',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_childstate',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        targetPortfolioLevel: 1,

        label: '{0} in "No Entry” state with {1}s in "Front Door" state or beyond',
        description: '{0} in "No Entry” state with {1}s in "Front Door" state or beyond'
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getDescription: function() {
        var msg = Ext.String.format(
            this.description,
            /[^\/]*$/.exec(this.getModel()),
            /[^\/]*$/.exec(this.portfolioItemTypes[this.targetPortfolioLevel - 1].Name)
        );
        return msg;
    },
    getFetchFields: function() {
        return ['Children']; //:summary[State]'];
    },
    getLabel: function(){
        this.label = Ext.String.format(
            this.label,
            /[^\/]*$/.exec(this.getModel()),
            /[^\/]*$/.exec(this.portfolioItemTypes[this.targetPortfolioLevel - 1].Name)
        );
        return this.label;
    },
    applyRuleToRecord: function(record) {
        if ( true ) {
            return this.getDescription();
        } else {
            return null; // no rule violation
        }
    }
});