Ext.define('CA.techservices.validation.PortfolioOrphan',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsrule_portfolioorphan',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        targetPortfolioLevel: 0,

        label: 'Orphaned {0}',
        description: '{0} has an {1} of "{2}" and {0} has no parent',
        criteriaField: 'InvestmentCategory',
        criteriaValue: 'Build',
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getDescription: function() {
        var msg = Ext.String.format(
            this.description,
            this.portfolioItemTypes[this.targetPortfolioLevel].Name,
            this.criteriaField,
            this.criteriaValue
        );
        return msg;
    },
    getFetchFields: function() {
        return ['FormattedID','Name','Parent',this.criteriaField];
    },
    getLabel: function(){
        var msg = Ext.String.format(
            this.label,
            this.portfolioItemTypes[this.targetPortfolioLevel].Name
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
        return Rally.data.wsapi.Filter.and([{
            property: 'Parent',
            value: null
        },{
            property: this.criteriaField,
            value: this.criteriaValue
        }]);
    }
});