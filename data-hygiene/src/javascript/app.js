Ext.define("data-hygiene", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    integrationHeaders : {
        name : "data-hygiene"
    },
    getSettingsFields: function() {
        return [];
    },
    config: {
        defaultSettings: {
            portfolioAOPField: 'Ready',
            portfolioCRField: 'Ready',
            userStoryCRField: 'Ready'
        }
    },

    scheduleStates: ['Defined','In-Progress','Completed','Accepted'],

    launch: function() {
        // get any data model customizations ... then get the data and render the chart
        this._fetchPortfolioItemTypes().then({
            success: this._initializeApp,
            failure: this._showErrorMsg,
            scope: this
        });
    },
    _initializeApp: function(portfolioItemTypes){
        this.logger.log('InitializeApp',portfolioItemTypes);

        this.portfolioItemTypes = portfolioItemTypes;

        this._loadData();
    },
    _showErrorMsg: function(msg){
        Rally.ui.notify.Notifier.showError({message:msg});
    },
    _fetchPortfolioItemTypes: function(){
        var deferred = Ext.create('Deft.Deferred');
        Ext.create('Rally.data.wsapi.Store',{
            model: 'typedefinition',
            fetch:['TypePath','Ordinal','Name'],
            filters: [{property:'TypePath',operator:'contains',value:'PortfolioItem/'}],
            sorters: [{property:'Ordinal',direction:'ASC'}]
        }).load({
            callback: function(records,operation){
                if (operation.wasSuccessful()){
                    var portfolioItemArray = [];
                    Ext.Array.each(records,function(rec){
                        portfolioItemArray.push(rec.getData());
                    });
                    deferred.resolve(portfolioItemArray);
                } else {
                    var message = 'failed to load Portfolio Item Types ' + (operation.error && operation.error.errors.join(','));
                    deferred.reject(message);
                }
            }
        });
        return deferred;
    },
    _loadData: function(){
        var me = this;

        this.validator = this._createValidator();

        Deft.Chain.pipeline([
            function() {
                me.setLoading("Gathering data...");
                return me.validator.gatherData();
            },
            function() {
                me.setLoading("Analyzing data...");
                return me.validator.getChartData();
            }
        ]).then({
            scope: this,
            success: function(results) {
                this.logger.log('_loadData results', results);

                //if ( results.categories && results.categories.length === 0 ) {
                //    // if no results - erase the underlying, previously rendered chart
                //    this.down('#display_box').removeAll();
                //    Ext.Msg.alert('','No violations found with current selections.');
                //    return;
                //}
                //
                this.logger.log('this.display_rows', this.validator.recordsByModel);
                //
                this._buildGrid(results);
                //this._makeChart(results);
            },
            failure: function(msg) {
                Ext.Msg.alert('Problem loading data', msg);
            }
        }).always(function() { me.setLoading(false); });
    },

    _buildGrid: function(chartData){
        var hash = this._reprocessChartData(chartData);

        Ext.Object.each(hash, function(type, obj){
            this._buildSubGrid(type, obj);
        }, this);

    },
    _reprocessChartData: function(chartData){
        var hash = {};
        this.logger.log('_reprocessChartData', chartData);
        Ext.Array.each(chartData.series, function(s){
            if (!hash[s.stack]){
                hash[s.stack] = {};
            }
            if (!hash[s.stack][s.name]){
                hash[s.stack][s.name] = {};
                Ext.Array.each(chartData.categories, function(c){
                    hash[s.stack][s.name][c] = 0;
                });
            }
            Ext.Array.each(s.records, function(r){
                var proj = (r.get('Project').Name);
                hash[s.stack][s.name][proj]++;
            });
        });
        this.logger.log('_reprocessChartData', hash);
        return hash;
    },
    _buildSubGrid: function(type, obj){
        var data = [],
            fields = [],
            projectNames = [];
        Ext.Object.each(obj, function(rule, projects){
            var row = projects;
            row.name = Ext.String.format(rule, type);
            projectNames = Ext.Object.getKeys(projects);
            data.push(row);
        });

        var fields = [{
            name: 'name', displayName: Ext.String.format('{0} level data hygiene', this.getUserFriendlyName(type))
        }];
        Ext.Array.each(projectNames, function(pn){
            fields.push({
                name: pn,
                displayName: pn
            });
        });

        var store = Ext.create('Rally.data.custom.Store',{
            data: data,
            fields: fields
        });

        var columnCfgs = [{
            dataIndex: 'name',
            text: Ext.String.format('{0} level data hygiene', this.getUserFriendlyName(type)),
            flex: 1
        }];

        Ext.Array.each(fields, function(f){
            if (f.name !== 'name') {
                columnCfgs.push({
                    dataIndex: f.name,
                    text: f.displayName
                });
            }
        });

        this.add({
            xtype: 'rallygrid',
            store: store,
            margin: 20,
            columnCfgs: columnCfgs,
            showPagingToolbar: false,
            showRowActionsColumn: false
        });
    },
    getUserFriendlyName: function(type){
        var name = '';
        if (/PortfolioItem/.test(type)){
            Ext.Array.each(this.portfolioItemTypes, function(p){
                if (p.TypePath === type){
                    name = p.Name;
                    return false;
                }
            });
        }
        if (type === 'HierarchicalRequirement'){
            name = 'User Story';
        }

        return name;
    },
    getPortfolioAOPField: function(){
        return this.getSetting('portfolioAOPField');
    },
    getPortfolioCRField: function(){
        return this.getSetting('portfolioCRField');
    },
    getStoryCRField: function(){
        return this.getSetting('userStoryCRField');
    },
    _createValidator: function() {
        var rules = [{
            xtype:'tsportfolio_orphan',
            targetPortfolioLevel: 1,
            portfolioItemTypes: this.portfolioItemTypes
        },{
            xtype: 'tsportfolio_project',
            targetPortfolioLevel: 1,
            portfolioItemTypes: this.portfolioItemTypes,
            portfolioProjects: []
        },{
            xtype: 'tsportfolio_childstate',
            targetPortfolioLevel: 1,
            portfolioItemTypes: this.portfolioItemTypes
        },{
            xtype: 'tsportfolio_fieldvalue',
            targetPortfolioLevel: 1,
            portfolioItemTypes: this.portfolioItemTypes,
            targetField: this.getPortfolioAOPField(),
            label: '{0}s with "AOP Approved" field checked',
            description: '{0}s with "AOP Approved" field checked',
            targetFieldValue: true
        },{
            xtype: 'tsportfolio_fieldvalue',
            targetPortfolioLevel: 1,
            portfolioItemTypes: this.portfolioItemTypes,
            targetField: this.getPortfolioAOPField(),
            label: '{0}s with "AOP Approved" field <b>not</b> checked',
            description: '{0}s with "AOP Approved" field <b>not</b> checked',
            targetFieldValue: false
        },{
            xtype:'tsportfolio_orphan',
            targetPortfolioLevel: 0,
            portfolioItemTypes: this.portfolioItemTypes
        },{
            xtype: 'tsportfolio_project',
            targetPortfolioLevel: 0,
            portfolioItemTypes: this.portfolioItemTypes,
            portfolioProjects: []
        },{
            xtype: 'tsportfolio_fieldvalue',
            targetPortfolioLevel: 0,
            portfolioItemTypes: this.portfolioItemTypes,
            targetField: this.getPortfolioCRField(),
            label: '{0}s with "CR" field checked',
            description: '{0}s with "CR" field checked',
            targetFieldValue: true
        },{
            xtype: 'tsportfolio_fieldvalue',
            targetPortfolioLevel: 0,
            portfolioItemTypes: this.portfolioItemTypes,
            targetField: this.getPortfolioCRField(),
            label: '{0}s with "CR" field <b>not</b> checked',
            description: '{0}s with "CR" field <b>not</b> checked',
            targetFieldValue: false
        },{
            xtype:'tsstory_orphan',
            portfolioItemTypes: this.portfolioItemTypes
        },{
            xtype:'tsstory_project',
            storyProjects: []
        },{
            xtype:'tsstory_planestimate',
            scheduleStates: this.scheduleStates
        },{
            xtype:'tsstory_missingrelease',
            scheduleStates: this.scheduleStates
        },{
            xtype:'tsstory_mismatchedrelease',
            portfolioItemTypes: this.portfolioItemTypes,
            scheduleStates: this.scheduleStates
        },{
            xtype: 'tsstory_fieldvalue',
            targetField: this.getStoryCRField(),
            label: 'User Stories with "CR" field checked',
            description: 'User Stories with "CR" field checked',
            targetFieldValue: true
        },{
            xtype: 'tsstory_fieldvalue',
            targetField: this.getStoryCRField(),
            label: 'User Stories with "CR" field <b>not</b> checked',
            description: 'User Stories with "CR" field <b>not</b> checked',
            targetFieldValue: false
        }];

        var validator = Ext.create('CA.techservices.validator.Validator',{
                rules: rules,
                fetchFields: ['FormattedID','ObjectID','Project']
        });
        return validator;
    },
    getSettingsFields: function(){
        var labelWidth = 150;

        return [{
            xtype: 'rallyfieldcombobox',
            name: 'portfolioAOPField',
            model: 'PortfolioItem',
            fieldLabel: 'Portfolio AOP Approved Field',
            labelAlign: 'right',
            labelWidth: labelWidth,
            _isNotHidden: function(field) {
                return !field.hidden && field.attributeDefinition && field.attributeDefinition.AttributeType === "BOOLEAN";
            }

        },{
            xtype: 'rallyfieldcombobox',
            name: 'portfolioCRField',
            model: 'PortfolioItem',
            fieldLabel: 'Portfolio CR Field',
            labelAlign: 'right',
            labelWidth: labelWidth,
            _isNotHidden: function(field) {
                return !field.hidden && field.attributeDefinition && field.attributeDefinition.AttributeType === "BOOLEAN";
            }
        },{
            xtype: 'rallyfieldcombobox',
            name: 'userStoryCRField',
            model: 'HierarchicalRequirement',
            fieldLabel: 'User Story CR Field',
            labelAlign: 'right',
            labelWidth: labelWidth,
            _isNotHidden: function(field) {
                return !field.hidden && field.attributeDefinition && field.attributeDefinition.AttributeType === "BOOLEAN";
            }
        }];
    },
     getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        // Ext.apply(this, settings);
        this.launch();
    }
});
