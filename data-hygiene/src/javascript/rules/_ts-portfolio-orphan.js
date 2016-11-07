Ext.define('CA.techservices.validation.PortfolioOrphan',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_orphan',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        targetPortfolioLevel: 0,

        label: 'Orphan {0} (no parent {1})'
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getDescription: function() {
        console.log('getLabel', this.portfolioItemTypes[this.targetPortfolioLevel].Name);
         var msg = Ext.String.format(
            this.label,
            this.portfolioItemTypes[this.targetPortfolioLevel].Name,
            this.portfolioItemTypes[this.targetPortfolioLevel + 1].Name
        );
        return msg;
    },
    getFetchFields: function() {
        return ['Name','Parent'];
    },
    getLabel: function(){
        console.log('getLabel', this.portfolioItemTypes[this.targetPortfolioLevel].Name);
        var msg = Ext.String.format(
            this.label,
            this.portfolioItemTypes[this.targetPortfolioLevel].Name,
            this.portfolioItemTypes[this.targetPortfolioLevel + 1].Name
        );
        return msg;
    },
    applyRuleToRecord: function(record) {
        if ( Ext.isEmpty(record.get('Parent') ) ) {
            return this.getDescription();
        } else {
            return null; // no rule violation
        }
    }
});