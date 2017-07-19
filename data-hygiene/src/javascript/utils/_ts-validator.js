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

        var rules = [],
            rulesByType = {};
        Ext.Array.each(this.rules, function(rule){
            console.log('rule', rule);
            var name = rule.xtype;
            if ( !Ext.isEmpty(name) ) {
                delete rule.xtype;
                var ruleObj = Ext.createByAlias('widget.' + name, rule);
                rulesByType[ruleObj.getModel()] = ruleObj;
                rules.push(ruleObj);
            }
        });
        this.rules = rules;
        this.rulesByType = rulesByType;
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
    getRulesByModel: function(){
       return this.rulesByType;
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
                console.log('rule', rule, filters);
                filters_by_model[model].push(filters);
            }
        });
        this.logger.log('filters_by_model', filters_by_model);

        Ext.Object.each(filters_by_model, function(model, filters){
            console.log('filters', filters);
            filters = Ext.Array.unique( Ext.Array.flatten(filters) );
            Ext.Array.each(filters, function(filter){
                console.log("filter", filter.toString());
            });
            filters_by_model[model] = Rally.data.wsapi.Filter.or(filters);
            console.log('filters', filters_by_model[model].toString());
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
            console.log('fields_by_model', model, fields);

            if ( !Ext.isEmpty(model) && !Ext.isEmpty(fields) && fields.length > 0 ) {
                if ( Ext.isEmpty(fields_by_model[model]) ) {

                    fields_by_model[model] = [me.categoryField,'Name'];
                }
                fields_by_model[model].push(fields);
            }
        });
        console.log('fields_by_model', fields_by_model);
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

        console.log("gatherData:");

        var fetch_by_model = this.getFetchFieldsByModel();
        var filters_by_model = this.getFiltersByModel();

        console.log("gatherData: fetch_by_model",fetch_by_model);

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
    getChartData: function() {
        if ( this.recordsByModel == {} ) {
            console.log('No search results');
            return {};
        }

        var categories = this.getCategories();
        var series = this.getSeries(categories);

        return { series: series, categories: categories };

    },

    getCategories: function() {
        var me = this,
            records = Ext.Array.flatten(Ext.Object.getValues(this.recordsByModel));

        var category_field = this.categoryField;

        var possible_categories = Ext.Array.map(records, function(record) {
            return me.getCategoryFromRecord(record,category_field);
        });

        return Ext.Array.unique(possible_categories);
    },

    getCategoryFromRecord: function(record,category_field) {
        if ( Ext.isEmpty(record.get(category_field)) ) { return ""; }
        if ( Ext.isString(record.get(category_field)) ) { return record.get(category_field); }
        return record.get(category_field)._refObjectName;
    },

    getSeries: function(categories) {
        var me = this,
            category_field = me.categoryField,
            series = [];

        // one series per rule, one stack per model type
        Ext.Array.each(this.getActiveRules(), function(rule){
            var series_name = rule.getUserFriendlyRuleLabel();
            var model = rule.getModel();
            var records = me.recordsByModel[model];

            var failed_records = me.getFailedRecordsForRule(records, rule);

            var records_by_category = me.getRecordsByCategory(failed_records, categories, category_field);

            var data = [];
            Ext.Array.each(categories, function(category){
                var category_records = records_by_category[category] || [];

                var count = category_records.length;
                var datum = {
                    y: count,
                    _records: category_records,
                    _name: series_name
                };

                if ( !Ext.isEmpty(me.pointEvents) ) {
                    datum.events = me.pointEvents
                }
                data.push(datum);
            });
            series.push({
                name: series_name,

                records: failed_records,
                data: data,
                stack: model
            });
        });

        return series;
    },

    //getFailedRecordsForRule: function(records, rule) {
    //    var failed_records = [];
    //    console.log('getFailedRecordsForRule', records, rule);
    //    Ext.Array.each(records, function(record) {
    //        var failure = rule.applyRuleToRecord(record);
    //        if ( failure ) {
    //            var texts = record.get('__ruleText') || [];
    //            texts.push(failure);
    //            record.set('__ruleText', texts);
    //            failed_records.push(record);
    //        }
    //    });
    //
    //    return failed_records;
    //},
    fetchData: function(baseFilters){
        var deferred = Ext.create('Deft.Deferred');
        var promises = [],
            projectGroups = this.projectGroups,
            me = this;

        Ext.Array.each(this.rules, function(rule){
           promises.push(me.fetchDataForProjectGroups(rule, projectGroups, baseFilters));
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
    fetchDataForProjectGroups: function(rule, projectGroups, baseFilters){
        var deferred = Ext.create('Deft.Deferred');
        var promises = [];

        Ext.Array.each(projectGroups, function(p){
            promises.push(rule.apply(p, baseFilters));
        });

        Deft.Promise.all(promises).then({
            success:function(results){
                var idx = 0,
                    hash = {
                        ruleName: rule.getLabel(),
                        type: rule.getModel()
                    };

                Ext.Array.each(projectGroups, function(pg){
                    hash[pg.Name] = results[idx++];
                });
                deferred.resolve(hash);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred.promise;
    },
    getRecordsByCategory: function(records, categories, category_field) {
        var me = this,
            record_hash = {};

        Ext.Array.each(records, function(record){
            var category = me.getCategoryFromRecord(record,category_field);
            if ( Ext.isEmpty(record_hash[category]) ) {
                record_hash[category] = [];
            }
            record_hash[category].push(record);
        });

        return record_hash;
    },
    getGridData: function(){
        var deferred = Ext.create('Deft.Deferred');
        var promises = [],
            me = this;

        Ext.Array.each(this.projectGroups, function(p){
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
    fetchGridRow: function(projectID){
        var deferred = Ext.create('Deft.Deferred'),
            me = this,
            promises = [],
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
                    var name = rules[i].getLabel();
                    row[name] = {ruleConfig: rules[i].getConfig(),
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