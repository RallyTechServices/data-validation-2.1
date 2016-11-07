Ext.define('CA.techservices.validation.UserStoryFieldValue',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_fieldvalue',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        model: 'HierarchicalRequirement',
        targetField: null,
        targetFieldValue: null,
        label: 'Field Value'
    },

    getFetchFields: function() {
        return ['Name',this.targetField];
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