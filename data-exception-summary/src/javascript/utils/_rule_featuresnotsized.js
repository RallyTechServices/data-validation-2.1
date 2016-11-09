Ext.define('CA.techservices.validation.PortfolioNotSized',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsrule_portfolionotsized',

    /**
     *
     * Parent Initiative has an Investment Category of "Build"
     * Feature state is "In-Progress" or "Staging"
     * Feature field is not sized
     */

    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        targetPortfolioLevel: 0,

        label: '{0}s are not sized',
        description:  '{0}s are not sized.  <br/>Parent {1} has an Investment Category of "Build"<br/>' +
                      '{0} state is "In-Progress" or "Staging"<br/>' +
                      '{0} field is not sized',
        featureSizeField: 'PreliminaryEstimate',
        stateValues: ['In-Progress','Staging']
    },
    getModel:function(){
        return this.portfolioItemTypes[this.targetPortfolioLevel].TypePath;
    },
    getDescription: function() {
        var msg = Ext.String.format(
            this.description,
            this.portfolioItemTypes[this.targetPortfolioLevel].Name,
            this.portfolioItemTypes[this.targetPortfolioLevel+1].Name
        );
        return msg;
    },
    getFetchFields: function() {
        return ['FormattedID','Name','Parent','InvestmentCategory','State',this.featureSizeField];
    },
    getLabel: function(){
        var msg = Ext.String.format(
            this.label,
            this.portfolioItemTypes[this.targetPortfolioLevel].Name
        );
        return msg;
    },
    getFilters: function(){

        /**
         *
         * Parent Initiative has an Investment Category of "Build"
         * Feature state is "In-Progress" or "Staging"
         * Feature field is not sized
         */
        var filters = Ext.Array.map(this.stateValues, function(s){
            return {
                property: 'State',
                value: s
            }
        });
        filters = Rally.data.wsapi.Filter.or(filters);

        filters = filters.and(Ext.create('Rally.data.wsapi.Filter', {
            property: "InvestmentCategory",
            value: "Build"
        }));

        filters = filters.and(Ext.create('Rally.data.wsapi.Filter', {
            property: "PreliminaryEstimate",
            value: ""
        }));

        return filters;
    }
});