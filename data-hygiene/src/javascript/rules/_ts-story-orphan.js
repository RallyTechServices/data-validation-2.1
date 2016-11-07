Ext.define('CA.techservices.validation.StoryOrphan',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_orphan',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        model: 'HierarchicalRequirement',
        portfolioItemTypes: null,

        label: 'Orphan Stories (no parent {1})'
    },
    getModel:function(){
        return this.model;
    },
    getDescription: function() {

        var msg = Ext.String.format(
            this.label,
            this.portfolioItemTypes[0].Name
        );
        return msg;
    },
    getFetchFields: function() {
        return ['Name','Parent','PortfolioItem'];
    },
    getLabel: function(){
        var msg = Ext.String.format(
            this.label,
            this.portfolioItemTypes[0].Name
        );
        return msg;
    },
    applyRuleToRecord: function(record) {
        if ( Ext.isEmpty(record.get('Parent') && Ext.isEmpty(record.get('PortfolioItem'))) ) {
            return this.getDescription();
        } else {
            return null; // no rule violation
        }
    },
    getFilters: function() {
        return Rally.data.wsapi.Filter.and([{
            property:'Parent',
            value:""
        },{
            property: 'PortfolioItem',
            value: ""
        }]);

//        return [];
    }
});