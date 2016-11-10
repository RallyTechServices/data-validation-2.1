Ext.define('CA.technicalservices.dataquality.common.BaseRule',{
    extend: 'Ext.Base',
    alias:  'widget.tsrule_base',
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

    description: 'This is a description for the base rule',

    query: null,

    baseQuery: null,

    fetchFields: null,

    detailFetchFields: null,

    constructor: function(config) {
        console.log('beforeconfig', config, this);
        this.initialConfig = config;
        Ext.apply(this,config);
        console.log('afterconfig', config, this);
    },
    getFeatureName: function(){
        return this.portfolioItemTypes && this.portfolioItemTypes.length > 1 &&
            this.portfolioItemTypes[0].TypePath.replace('PortfolioItem/','');
    },
    getDescription: function() {
        return this.description;
    },
    getFetchFields: function() {
        return this.fetchFields || ['FormattedID'];
    },
    getDetailFetchFields: function(){
        return this.detailFetchFields || this.getFetchFields();
    },
    getLabel: function() {
        return this.label;
    },
    getModel: function() {
        return this.model;
    },
    getConfig: function(){
        return this.initialConfig;
    },
    getCountConfig: function(){
        return {
            model: this.getModel(),
            fetch: this.getFetchFields(),
            filters: this.getFilters()
        };
    },
    getTotalCountConfig: function(){
        return {
            model: this.getModel(),
            fetch: ['ObjectID'],
            filters: this.getBaseFilters()
        };
    },
    getBaseFilters: function(){

        if (this.baseQuery){
            return Rally.data.wsapi.Filter.fromQueryString(this.baseQuery);
        }

        return Ext.create('Rally.data.wsapi.Filter', {
            property:'ObjectID',
            operator:'>',
            value: 0
        });
    },
    getFilters: function() {
        if (this.query){
            return Rally.data.wsapi.Filter.fromQueryString(this.query);
        }
        return Ext.create('Rally.data.wsapi.Filter', {
            property:'ObjectID',
            operator:'>',
            value: 0
        });
    }
});