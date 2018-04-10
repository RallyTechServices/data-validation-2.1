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
        canceledState: "Canceled",

        label: 'Orphan {0}s (no parent {1})'
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getLabel: function(){
        var msg = Ext.String.format(
            this.label,
            this.portfolioItemTypes[this.targetPortfolioLevel].Name,
            this.portfolioItemTypes[this.targetPortfolioLevel + 1].Name
        );
        return msg;
    },
    getFilters: function(){
        return Rally.data.wsapi.Filter.fromQueryString("((State.Name != \"Canceled\") AND (Parent = \"\"))");
    }
});