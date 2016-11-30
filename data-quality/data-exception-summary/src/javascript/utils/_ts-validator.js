Ext.define('CA.techservices.validator.Validator',{
    alias: 'widget.tsvalidator',

    logger: new Rally.technicalservices.Logger(),
    /**
     *
     * [{rule}] An array of validation rules
     */
    rules: [],

    /**
     *
     */
    deliveryTeamProjects: [],       // listing of projects where a SCHEDULED feature might reside

    businessPlanningProjects: [],   // listing of programs where an UNSCHEDULED feature might reside

    recordsByModel: {},

    projectUtility: null, //This is the class passed in by initialize that holds the project hierarchy.  This is used for bucketing data
    currentProject: null, //Current project ObjectID so that we can determine which projects to display as "categories"

    categoryField: 'Project',

    // fields that all rules should fetch
    fetchFields: [],
    /**
     *
     * a hash containing events for a data point e.g.,
     *
     * points will include a field called _records holding the associated records
     * and each record will have a field called __ruleText holding a statement about
     * its violation
     *
     *     {
     *          click: function() {
     *          me.showDrillDown(this._records,this._name);
     *      }
     */
    pointEvents: null,
    /**
     *
     * a hash of filters by model type.  Filter will be ANDed to the filters we get from the validation rules
     * (which are themselves ORed together).
     */
    baseFilters: {},

    constructor: function(config) {
        Ext.apply(this,config);

        var rules = [];

        Ext.Array.each(this.rules, function(rule){

            var name = rule.exceptionClass || 'tsrule_base';
            if ( !Ext.isEmpty(name) ) {
                delete rule.xtype;
                rules.push(Ext.createByAlias('widget.' + name, rule));
            }
        });

        this.rules = rules;
    },
    getRules: function(){
        return this.rules;
    },
    getRule: function(ruleName){
        var rule = null,
            label = ruleName && ruleName.ruleConfig && ruleName.ruleConfig.label;

        Ext.Array.each(this.getRules(), function(r){
            if (r.label === label){
                rule = r;
                return false;
            }
        });
        return rule;
    },
    /**
     * getGridData
     *
     * @returns [{},{},...] (an array of data objects that can be used in a custom store
     *
     * the "category" field is the same as the category for the violation
     * each rule will be a column and the resulting grid will show a count
     *
     */
    getGridData: function(){
        var deferred = Ext.create('Deft.Deferred');
        var buckets = this.projectUtility.getProjectDirectChildren(this.currentProject),
            promises = [],
            me = this;
        Ext.Array.each(buckets, function(p){
            promises.push(me.fetchGridRow(p));
        });

        Deft.Promise.all(promises).then({
            success:function(rows){
                deferred.resolve(rows);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred;
    },
    refreshRecord: function(record){
        var projectID = record.get('bucket');
        
        this.fetchGridRow(projectID).then({
            success: function(row){
                Ext.Object.each(row, function(field, value){
                    record.set(field, value);
                });
            }
        });
    },
    fetchGridRow: function(projectID){
        var deferred = Ext.create('Deft.Deferred'),
            me = this,
            promises = [],
            projectUtility = this.projectUtility,
            projectName = this.projectUtility.getProjectName(projectID),
            projectRef= '/project/' + projectID,
            rules = this.getRules();

        Ext.Array.each(rules, function(rule){
            var config = {
                model: rule.getModel(),
                fetch: rule.getFetchFields(),
                filters: rule.getFilters(),
                context: {project: projectRef, projectScopeDown: true}
            };
            if (!rule.exceptionClass){
                promises.push(me._loadWsapiCount(config));
            } else {
                promises.push(rule.getCount(projectID, projectUtility));
            }
        }, this);

        Deft.Promise.all(promises).then({
            success: function(results){
                var row = {
                    bucket: projectName,
                    bucketID: projectID,
                };
                for (var i=0; i < rules.length; i++){
                    var name = rules[i].getLabel();
                    row[name] = {
                        ruleConfig: rules[i].getConfig(),
                        value: results[i] || 0
                    };
                }
                deferred.resolve(row);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred;
    },

    _loadWsapiRecords: function(config) {
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store',config).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    var result = {};
                    result[config.model] = records;
                    deferred.resolve(records);
                } else {
                    deferred.reject(operation.error.errors.join(','));
                }
            }
        });
        return deferred.promise;
    },
    _loadWsapiCount: function(config){
        var deferred = Ext.create('Deft.Deferred');

        config.pageSize = 1;
        config.limit = 1;

        Ext.create('Rally.data.wsapi.Store',config).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    deferred.resolve(operation.resultSet.totalRecords);
                } else {
                    deferred.reject(operation.error.errors.join(','));
                }
            }
        });
        return deferred.promise;
    }
});