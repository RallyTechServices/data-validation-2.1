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
    getDescription: function() {
        var msg = Ext.String.format(
            this.description,
            this.portfolioItemTypes[this.targetPortfolioLevel].Name,
            this.portfolioItemTypes[this.targetPortfolioLevel + 1].Name
        );
        return msg;
    },
    getFetchFields: function() {
        return ['Name',this.targetField];
    },
    getLabel: function(){
        var msg = Ext.String.format(
            this.label,
            this.portfolioItemTypes[this.targetPortfolioLevel].Name,
            this.portfolioItemTypes[this.targetPortfolioLevel + 1].Name
        );
        return msg;
    },
    applyRuleToRecord: function(record) {
        if (!this.targetField){
            return null;
        }

        var val = record.get(this.targetField);
        if (val === this.targetFieldValue){
            return this.getDescription();
        }
        return null;
    },
    getFilters: function() {
        return Ext.create('Rally.data.wsapi.Filter', {
            property: this.targetField,
            value: this.targetFieldValue
        });
//        return [];
    }
});