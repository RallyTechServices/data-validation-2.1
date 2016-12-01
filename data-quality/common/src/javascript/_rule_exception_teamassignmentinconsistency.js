Ext.define('CA.technicalservices.dataquality.common.TeamAssignmentInconsistency',{
    extend: 'CA.technicalservices.dataquality.common.BaseRule',
    alias:  'widget.rule_teamassignmentinconsistency',
    getCount: function(projectID, projectUtility){
        var deferred = Ext.create('Deft.Deferred');

        var projectRef= '/project/' + projectID,
            config = {
                model: this.getModel(),
                fetch: ['ObjectID','Project','Owner','c_WorkdayTeam'],
                filters: this.getFilters(),
                context: {project: projectRef, projectScopeDown: true},
                compact: false,
                pageSize: 2000,
                limit: Infinity
            };

        this._loadWsapiRecords(config).then({
            success: function(records){
                var recordData = _.map(records, function(r){ return r.getData(); }),
                    obj = this._processRecords(recordData);

                if (!this.flaggedItems){
                    this.flaggedItems = {};
                }
                this.flaggedItems[projectID] = obj;

                deferred.resolve(obj.count);
            },
            scope: this
        });
        return deferred;
    },
    _processRecords: function(recordData){
        var flaggedStories = [],
            count = 0;

        for (var i=0; i<recordData.length; i++){
            var r = recordData[i];
            if (Number(r.Owner.c_WorkdayTeam) !== r.Project.ObjectID){
                flaggedStories.push(r.ObjectID);
                count++;
            }
        }
        return {
            count: count,
            flaggedStories: flaggedStories
        };
        //return affectedProjects;
    },
    getDetailFilters: function(projectID, projectUtility){

        var obj = this.flaggedItems[projectID],
            stories = obj.flaggedStories;

        var filters = Ext.Array.map(stories, function(o){ return {
                property: 'ObjectID',
                value: o
            };
        });

        if (filters && filters.length > 1){
             return Rally.data.wsapi.Filter.or(filters);
        }
        if (filters.length === 0){
            filters = {
                property: 'ObjectID',
                value: 0
            };
        }
        return filters;
    }
});