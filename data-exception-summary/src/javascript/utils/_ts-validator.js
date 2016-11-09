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

            var name = rule.xtype;
            if ( !Ext.isEmpty(name) ) {
                delete rule.xtype;
                rules.push(Ext.createByAlias('widget.' + name, rule));
            }
        });

        this.rules = rules;
    },

    getRuleDescriptions: function() {
        var text = "<ul>";

        Ext.Array.each(this.getRules(), function(rule){
            var rule_description = rule.getDescription() || "";
            if ( !Ext.isEmpty(rule_description) ) {
                text = text + "<li>" + rule_description + "</li>";
            }
        });
        text = text + "</ul>";
        return text;
    },

    getRules: function(){
        return this.rules;
    },

    getFiltersByModel: function() {
        var me = this,
            filters_by_model = {};

        Ext.Array.each(this.getRules(), function(rule){
            var model = rule.getModel();
            var filters = rule.getFilters();

            if ( !Ext.isEmpty(model) && !Ext.isEmpty(filters) ) {
                if ( Ext.isEmpty(filters_by_model[model]) ) {
                    filters_by_model[model] = [];
                }
                filters_by_model[model].push(filters);
            }
        });
        this.logger.log('filters_by_model', filters_by_model);

        Ext.Object.each(filters_by_model, function(model, filters){
            filters = Ext.Array.unique( Ext.Array.flatten(filters) );
            filters_by_model[model] = Rally.data.wsapi.Filter.or(filters);
            if ( me.baseFilters && !Ext.Object.isEmpty(me.baseFilters) && me.baseFilters[model] && me.baseFilters[model] != {} ) {
                filters_by_model[model] = filters_by_model[model].and(me.baseFilters[model]);
            }
        });
        return filters_by_model;
    },

    getFetchFieldsByModel: function() {
        var me = this,
            fields_by_model = {};

        Ext.Array.each(this.getRules(), function(rule){
            var model = rule.getModel();
            var fields = rule.getFetchFields();

            if ( !Ext.isEmpty(model) && !Ext.isEmpty(fields) && fields.length > 0 ) {
                if ( Ext.isEmpty(fields_by_model[model]) ) {

                    fields_by_model[model] = [me.categoryField,'Name'];
                }
                fields_by_model[model].push(fields);
            }
        });
        Ext.Object.each(fields_by_model, function(model, fields){
            fields = Ext.Array.flatten(fields);
            fields = Ext.Array.push(fields, me.fetchFields);

            fields_by_model[model] = Ext.Array.unique(fields);
        });

        return fields_by_model;
    },
    // returns a promise, promise fulfilled by hash of results by model type
    gatherData: function() {
        var deferred = Ext.create('Deft.Deferred'),
            me = this;


        var fetch_by_model = this.getFetchFieldsByModel();
        var filters_by_model = this.getFiltersByModel();


        var promises = [];
        Ext.Object.each(fetch_by_model, function(model, fetch){
            var config = {
                model: model,
                fetch: fetch,
                limit: Infinity,
                filters: filters_by_model[model]
            };

            var promise = function() {
                return this._loadWsapiRecords(config);
            };
            promises.push(promise);
        },this);

        console.log('promises', promises);

        Deft.Chain.sequence(promises,this).then({
            success: function(results) {
                me.recordsByModel = {};
                Ext.Array.each(results, function(result) {
                    me.recordsByModel = Ext.apply(me.recordsByModel, result);
                });
                deferred.resolve(results);
            },
            failure: function(msg) {
                deferred.reject(msg);
            }
        });
        return deferred.promise;
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
        if ( this.recordsByModel == {} ) {
            console.log('No search results');
            return [];
        }
        console.log('getGridData');
        var records = Ext.Array.flatten(Ext.Object.getValues(this.recordsByModel));

        var projectUtility = this.projectUtility,
            projectLevel = projectUtility.getProjectLevel(this.currentProject),
            hash = {};

        Ext.Array.each(records, function(r){
            var projectID = r.get('Project').ObjectID,
                bucket = projectUtility.getProjectAncestor(projectID, projectLevel+1),
                model = r.get('_type').toLowerCase();

            if (!hash[bucket]){
                hash[bucket] = {};
            }
            if (!hash[bucket][model]){
                hash[bucket][model] = [];
            }
            hash[bucket][model].push(r);
        }, this);


        var data = [],
            me = this;
        Ext.Object.each(hash, function(bucket, recordsByModel){
            var row = {
                bucket: this.projectUtility.getProjectName(bucket),
                bucketID: bucket
            };
            Ext.Array.each(this.getRules(), function(rule){
                var ruleId = rule.getUserFriendlyRuleLabel();
                var model = rule.getModel().toLowerCase();
                var records = recordsByModel[model] || [];

                var failed_records = me.getFailedRecordsForRule(records, rule);
                row[ruleId] = {
                    name: rule.getUserFriendlyRuleLabel(),
                    description: rule.getDescription(),
                    failedRecords: failed_records,
                    violations: failed_records.length
                };
            });
            data.push(row);
        }, this);
        return data;
    },
    //getChartData: function() {
    //    if ( this.recordsByModel == {} ) {
    //        console.log('No search results');
    //        return {};
    //    }
    //
    //    var categories = this.getCategories();
    //    var series = this.getSeries(categories);
    //
    //    return { series: series, categories: categories };
    //
    //},

    getBuckets: function() {
        var records = Ext.Array.flatten(Ext.Object.getValues(this.recordsByModel));

        var projects = Ext.Array.map(records, function(r){
            return r.get('Project').ObjectID;
        });
        projects = Ext.Array.unique(projects);

        var projectLevel = this.projectUtility.getProjectLevel(this.currentProject);

        var buckets = Ext.Array.map(projects, function(p) {
            return this.projectUtility.getProjectAncestor(p, projectLevel+1);
        }, this);

        return Ext.Array.unique(buckets);
    },

    getGridDataWithoutRecords: function(){
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
            projectName = this.projectUtility.getProjectName(projectID),
            projectRef= '/project/' + projectID,
            rules = this.getRules();
        console.log('rules', rules);
        Ext.Array.each(rules, function(rule){
            var config = {
                model: rule.getModel(),
                fetch: rule.getFetchFields(),
                filters: rule.getFilters(),
                context: {project: projectRef, projectScopeDown: true}
            };
            console.log('fetchGridRow', config);
            console.log('fetchGridRow', config.filters.toString());
            promises.push(me._loadWsapiCount(config))
        });

        Deft.Promise.all(promises).then({
            success: function(results){
                var row = {
                    bucket: projectName,
                    bucketID: projectID,
                };
                for (var i=0; i < rules.length; i++){
                    var name = rules[i].getUserFriendlyRuleLabel();
                    row[name] = {id: rules[i].alias[0],
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
    getFailedRecordsForRule: function(records, rule) {
        var failed_records = [];
        Ext.Array.each(records, function(record) {
            var failure = rule.applyRuleToRecord(record);
            if ( failure ) {
                var texts = record.get('__ruleText') || [];
                texts.push(failure);
                record.set('__ruleText', texts);
                failed_records.push(record);
            }
        });

        return failed_records;
    },

    _loadWsapiRecords: function(config) {
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store',config).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    var result = {};
                    result[config.model] = records;
                    deferred.resolve(result);
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