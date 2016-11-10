Ext.define('CA.technicalservices.validator.Validator',{
    alias: 'widget.tsvalidator',

    logger: new Rally.technicalservices.Logger(),
    /**
     *
     * [{rule}] An array of validation rules
     */
    rules: [],

    constructor: function(config) {
        Ext.apply(this,config);

        var rules = [];

        Ext.Array.each(this.rules, function(rule){
            var name = rule.xtype || 'tsrule_base';
            if ( !Ext.isEmpty(name) ) {
                delete rule.xtype;
                rules.push(Ext.createByAlias('widget.' + name, rule));
            }
        });
        this.logger.log('Validator.constructor', this.rules);
        this.rules = rules;
    },
    run: function(){
        var deferred = Ext.create('Deft.Deferred');
        this.logger.log('run', this.rules);
        var promises = [],
            me = this;
        Ext.Array.each(this.rules, function(rule){
            promises.push(me.updateRule(rule));
        });

        Deft.Promise.all(promises).then({
            success: function(){
                deferred.resolve(this);
            },
            failure: function(msg){
                deferred.reject(msg);
            },
            scope: this
        });

        return deferred;
    },
    updateRule: function(rule){
        var deferred = Ext.create('Deft.Deferred');

        this.logger.log('updateRule', rule.model);
        this.getTotalCount(rule.model).then({
            success: function(totalCount){
                rule.totalCount = totalCount;
                this.logger.log('updateRule.getTotalCount', rule.model, totalCount);

                var config = rule.getCountConfig();
                config.context = {
                    project: this.projectRef,
                    projectScopeDown: true
                };

                this._loadWsapiCount(config).then({
                    success: function(count){
                        this.logger.log('updateRule._loadWsapiCount', rule.getLabel(), count, config);
                        rule.flaggedCount = count;
                        deferred.resolve();
                    },
                    failure: function(msg){
                        deferred.reject(msg);
                    },
                    scope: this
                });
            },
            failure: function(msg){
                deferred.reject(msg);
            },
            scope: this
        });
        return deferred;
    },
    getTotalCount: function(model){
        var deferred = Ext.create('Deft.Deferred');
        if (this.totalCounts && this.totalCounts[model]){
            deferred.resolve(this.totalCounts[model]);
        } else {
            this._loadWsapiCount({
                model: model,
                fetch: ['ObjectID'],
                context: {
                    project: this.projectRef,
                    projectScopeDown: true
                }
            }).then({
                success: function(count){
                    if (!this.totalCounts){
                        this.totalCounts = {};
                    }
                    this.totalCounts[model] = count;
                    deferred.resolve(count);
                },
                failure: function(msg){
                    deferred.reject(msg);
                },
                scope: this
            });
        }
        return deferred;
    },
    getRules: function(){
        return this.rules;
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