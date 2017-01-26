Ext.define('CA.techservices.validation.PortfolioFieldValue',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsportfolio_fieldvalue',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        portfolioItemTypes:[],
        targetPortfolioLevel: 0,
        targetField: null,
        targetFieldValue: null,
        label: 'Field Value'
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
    getFilters: function() {
        if (this.targetFieldValue === "No"){
            var filters = [{
                property: this.targetField,
                value: this.targetFieldValue
            },{
                property: this.targetField,
                value: ""
            }];
            return Rally.data.wsapi.Filter.or(filters);
        }

        return Ext.create('Rally.data.wsapi.Filter', {
            property: this.targetField,
            value: this.targetFieldValue
        });
    }
});