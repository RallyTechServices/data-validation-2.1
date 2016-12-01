Ext.define('CA.technicalservices.dataquality.common.LeafProjectBuildPercentRule',{
    extend: 'CA.technicalservices.dataquality.common.BaseRule',
    alias:  'widget.rule_leafprojectbuildpercentrule',

    getUseRallyGrid: function(){
        return true;
    },
    getCount: function(projectID, projectUtility){
        var deferred = Ext.create('Deft.Deferred');

        if (this.recordData){
            var count = this._processRecords(projectID, projectUtility).length;
            deferred.resolve(count);
        } else {
            var projectRef= '/project/' + projectID,
                config = {
                    model: this.getModel(),
                    fetch: this.getFetchFields(),
                    filters: this.getFilters(),
                    context: {project: projectRef, projectScopeDown: true},
                    limit: Infinity
                };

            this._loadWsapiRecords(config).then({
                success: function(records){
                    this.recordData = _.map(records, function(r){ return r.getData(); });
                    var count = this._processRecords(projectID, projectUtility).length;
                    deferred.resolve(count);
                },
                scope: this
            });
        }
        return deferred;
    },
    _processRecords: function(projectID,projectUtility){
        var children = projectUtility.getAllChildren(projectID),
            oids = [];

        Ext.Array.each(this.recordData, function(r){
            if (Ext.Array.contains(children, r.ObjectID)){
                oids.push(r.ObjectID);
            }
        });

       return oids;
    },
    getDetailFilters: function(projectID, projectUtility){
        var oids = this._processRecords(projectID, projectUtility);
        var filters = Ext.Array.map(oids, function(o){ return {
                property: 'ObjectID',
                value: o
            };
        });
        if (filters && filters.length > 1){
            return Rally.data.wsapi.Filter.or(filters);
        }
        return filters;

    },
    getDetailColumnConfigs: function(){
        return [{
            dataIndex: 'Name',
            text: 'Name'
        },{
            dataIndex: 'c_BuildPercent',
            text: 'Build Percent'
        }]
    }
});