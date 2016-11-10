Ext.define('CA.techservices.validation.InvestmentCategoryMisaligned',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsrule_investmentcategorymisaligned',

    /**
     *
     * Parent has an Investment Category of "Build"
     * Initiative state is "Elaborating", "In-Progress" or "Staging"
     * Feature Investment Category does not match Initiative
     */

    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        targetPortfolioLevel: 0,

        label: 'Investment Category between {0} and {1} are not aligned',
        description:  'Investment Category between {0} and {1} are not aligned.  <br/>Parent {1} has an Investment Category of "Build"<br/>' +
        '{1} state is {2}<br/>' +
        '{0} Investment Category does not match {1} Parent',
        stateValues: ['Elaborate','In-Progress','Staging']
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getDescription: function() {
        var msg = Ext.String.format(
            this.description,
            this.portfolioItemTypes[0].Name,
            this.portfolioItemTypes[1].Name,
            this.stateValues.join(', ')
        );
        return msg;
    },
    getFetchFields: function() {
        return ['FormattedID','Name','Parent','InvestmentCategory','State'];
    },
    getLabel: function(){
        var msg = Ext.String.format(
            this.label,
            this.portfolioItemTypes[0].Name,
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
         * Parent has an Investment Category of "Build"
         * Initiative state is "Elaborating", "In-Progress" or "Staging"
         * Feature Investment Category does not match Initiative
         */
        var filters = Ext.Array.map(this.stateValues, function(s){
            return {
                property: 'Parent.State.Name',
                value: s
            }
        });
        filters = Rally.data.wsapi.Filter.or(filters);

        filters = filters.and(Ext.create('Rally.data.wsapi.Filter', {
            property: "Parent.InvestmentCategory",
            value: "Build"
        }));

        filters = filters.and(Ext.create('Rally.data.wsapi.Filter', {
            property: "InvestmentCategory",
            operator: '!=',
            value: "Build"
        }));

        return filters;
    }
});