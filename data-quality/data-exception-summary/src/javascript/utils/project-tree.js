Ext.define('CA.technicalservices.utils.ProjectUtilities',{

    fetch: ['ObjectID','Name','Parent'],
    mixins: {
        observable: 'Ext.util.Observable'
    },
    constructor: function(config){
        this.mixins.observable.constructor.call(this, config);

        var fetch = Ext.Array.merge(this.fetch, config && config.fetch || []);

        Ext.create('Rally.data.wsapi.Store',{
            model: 'Project',
            fetch: ['ObjectID','Name','Parent'],
            limit: Infinity,
            context: {project: null},
            pageSize: 2000,
            compact: false
        }).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    this._buildProjectParentHash(records);
                } else {
                    this.fireEvent('onerror', "Error fetching projects: " + operation.error && operation.error.errors.join(','));
                }
            },
            scope: this
        });
    },
    _buildProjectParentHash: function(records){

        var projectHash = {};
        Ext.Array.each(records, function(r){
            projectHash[r.get('ObjectID')] = r.getData();
        });
        this.projectHash= projectHash;
        this.fireEvent('ready');
    },
    getAncestry: function(projectID){
        var parent = this.projectHash[projectID].Parent && this.projectHash[projectID].Parent.ObjectID || null,
            ancestry = this.projectHash[projectID] && this.projectHash[projectID].ancestors;

        if (!ancestry){

            ancestry = [Number(projectID)];
            if (parent){
                do {
                    ancestry.unshift(parent);
                    parent = this.projectHash[parent] &&
                        this.projectHash[parent].Parent &&
                        this.projectHash[parent].Parent.ObjectID || null;

                } while (parent);
            }
            this.projectHash[projectID].ancestors = ancestry;
        }
        return ancestry;
    },
    getProjectAncestor: function(projectID, projectLevel){
        var ancestry = this.getAncestry(projectID);

        if (ancestry.length >= projectLevel){
            return ancestry[projectLevel - 1];
        }
        return null;
    },
    getProjectName: function(projectID){
        return this.projectHash[projectID] &&  this.projectHash[projectID].Name || "Unknown";
    },
    getProjectLevel: function(projectID){
        var ancestory = this.getAncestry(projectID);
        return ancestory.length;
    },
    isProjectLeafNode: function(projectID){
        var isLeafNode = true;
        var ms = Date.now();
        Ext.Object.each(this.projectHash, function(key, data){
            if (data.Parent && data.Parent.ObjectID === projectID){
                isLeafNode = false;
                return false;
            }
        });

        return isLeafNode;
    },
    getProjectDirectChildren: function(projectID){
        var children = [];
        Ext.Object.each(this.projectHash, function(key, data){
            if (data.Parent && data.Parent.ObjectID === projectID){
                children.push(key);
            }
        });

        if (children.length === 0){
            children.push(projectID);
        }
        return children;
    },
    getAllChildren: function(projectID){
        var children = []
            projectID = Number(projectID);

        Ext.Object.each(this.projectHash, function(key, data){
            var ancestry = this.getAncestry(key);

            if (Ext.Array.contains(ancestry, projectID)){
                children.push(Number(key));
            }
        }, this);

       return children;
    }

});