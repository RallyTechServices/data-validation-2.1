Ext.define('CA.techservices.validation.BaseRule',{
    extend: 'Ext.Base',
    /*
     * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
     * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
     */
    portfolioItemTypes:[],
    /**
     *
     * @cfg
     * {String} model The name of a record type that this rule applies to
     */
    model: null,
    /**
     *
     * @cfg {String} a human-readable label for the chart that will be made from the rule
     */
    label: 'No label supplied for this rule',

    constructor: function(config) {
        Ext.apply(this,config);
    },

    shouldExecuteRule: true,
    getFeatureName: function(){
        return this.portfolioItemTypes && this.portfolioItemTypes.length > 1 &&
            this.portfolioItemTypes[0].TypePath.replace('PortfolioItem/','');
    },
    getDescription: function() {
        return this.description;
    },

    getFetchFields: function() {
        return [];
    },
    getLabel: function() {
        //console.error('getLabel is not implemented in subclass ', this.self.getName());
        return this.label;
    },
    getModel: function() {
        return this.model;
    },

    getFilters: function() {
        return Ext.create('Rally.data.wsapi.Filter', {
            property:'ObjectID',
            operator:'>',
            value: 0
        });
    },
    // return false if the record doesn't match
    // return string if record fails the rule
    applyRuleToRecord: function(record) {
        console.error('applyRuleToRecord not implemented in subclass ', this.self.getName());
        throw 'applyRuleToRecord not implemented in subclass ' + this.self.getName();

        return record;
    },

    fetchUpdate: function(projectID){

    },
    /* override to allow the validator to check if the rule makes sense to run 
     * (e.g., the field checker for fields that don't even exist)
     * 
     * resolve promise with text if problem -- the validator will return the text so
     * it can be put into a description
     * 
     * The rule will still be executed unless this.shouldExecuteRule is set to false (and
     * the rule class implements skipping because of this.shouldExecuteRule).
     * 
     * A rule class could be multi-part and only partially fail, so execution or not execution
     * needs to be handled by the class itself.
     * 
     */
    precheckRule: function() {
        return null;
    },

    getUserFriendlyRuleLabel: function() {
        return this.getLabel();
    },
    getDetailFetchFields: function(){
        return this.getFetchFields();
    }
});