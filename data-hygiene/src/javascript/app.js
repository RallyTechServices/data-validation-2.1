Ext.define("data-hygiene", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    integrationHeaders : {
        name : "data-hygiene"
    },

    items: [
        {xtype:'container',itemId:'selector_box', flex: 1, float: 'right'},
        {xtype:'container',itemId:'chart_box', flex: 1},
        {xtype:'container',itemId:'grid_box', flex: 1}
    ],

    config: {
        defaultSettings: {
            portfolioAOPField: 'Ready',
            portfolioCRField: 'Ready',
            userStoryCRField: 'Ready',
            projectGroups: []
        }
    },

    scheduleStates: null,
    portfolioItemTypes: null,
    portfolioItemStates: null,

    launch: function() {
        // get any data model customizations ... then get the data and render the chart
        Deft.Promise.all([
            CA.technicalservices.Toolbox.fetchPortfolioItemTypes(),
            CA.technicalservices.Toolbox.fetchPortfolioItemStates(),
            CA.technicalservices.Toolbox.fetchScheduleStates()
        ]).then({
            success: this._initializeApp,
            failure: this._showErrorMsg,
            scope: this
        });
    },
    _initializeApp: function(results){
        this.logger.log('InitializeApp',results);

        this.portfolioItemTypes = results[0];
        this.portfolioItemStates = results[1];
        this.scheduleStates = results[2];

        this._loadData();
    },
    _showErrorMsg: function(msg){
        this.logger.log('_showErrorMsg', msg);
        Rally.ui.notify.Notifier.showError({message:msg});
    },

    _loadData: function(){
        var me = this;

        this.getExportBox().removeAll();
        this.getChartBox().removeAll();
        this.getGridBox().removeAll();

        this.validator = this._createValidator();
        this.logger.log('_loadData')
        this.validator.fetchData().then({
            success: function(data){
                this.logger.log('_loadData.success', data);
                this._addChart(data);
                this._buildGrids(data);
            },
            failure: this._showErrorMsg,
            scope: this
        }).always(function() { me.setLoading(false); });
    },

    _addChart: function(chartData){
        this.logger.log('addChart', chartData);
        //series: [{
        //    name: ruleName,
        //    data: [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
        //    stack: type

        var projects = _.map(this.getProjectGroups(), function(pg){
            return pg.groupName;
        });

        var ruleHash = {},
            types = [];

        Ext.Array.each(chartData, function(cd){
            if (!Ext.Array.contains(types, cd.type)){
                types.push(cd.type);
            }
            if (!ruleHash[cd.ruleName]){
                ruleHash[cd.ruleName] = {};
            }
            //if (!ruleHash[cd.ruleName][cd.type]){
            //    ruleHash[cd.ruleName][cd.type] = {};
            //}
            Ext.Array.each(projects, function(p){
                //ruleHash[cd.ruleName][cd.type][p] = cd[p] || 0;
                ruleHash[cd.ruleName][p] = cd[p] || 0;
            });
        });

        this.logger.log('chartData', ruleHash);

        var series = [],
            categories = Ext.Object.getKeys(ruleHash);

        Ext.Array.each(projects, function(p){
          //  Ext.Array.each(types, function(t){
                var values = [];
                Ext.Array.each(categories, function(r){
                    values.push(ruleHash[r] && ruleHash[r][p] || 0);
                });
                series.push({
                    name: p,
                    data: values
                   // stack: t
                });
           // });
        });

        this.logger.log('chartData', series, projects);
        this.getChartBox().add({
            xtype: 'rallychart',
            chartConfig: {
                chart: {
                    type: 'bar',
                    height: 500,
                    marginLeft: Math.max(this.getWidth()/2, 1)
                },
                title: {
                    text: null
                },
                xAxis: {
                    title: {
                        text: null
                    },
                    tickPlacement: 'on'
                },
                yAxis: [
                    {
                        title: {
                            text: 'Artifact Count'
                        }
                    }
                ],
                plotOptions: {
                    bar: {
                        stacking: 'normal'
                    }
                }
            },
            chartData: {
                series: series,
                categories: categories
            }
        });

    },
    export: function(){
        var grids = this.query('rallygrid');
        this.logger.log('export', grids);

        var csv = [];
        var keys = ['type','ruleName'],
            headers = ['Artifact Type', 'Rule'];

        Ext.Array.each(this.getProjectGroups(), function(pg){
            keys.push(pg.groupName);
            headers.push(pg.groupName);
        });

        Ext.Array.each(grids, function(grid){
            var records = grid.getStore() && grid.getStore().getRange();
            if (records && records.length > 0){
                csv.push(Ext.String.format("{0} Data Hygiene", this.getUserFriendlyName(records[0].get('type'))));
                csv.push(headers.join(','));
                Ext.Array.each(records, function(r){
                    var row = Ext.Array.map(keys, function(key){
                        var v = r.get(key) || 0;
                        if (key == 'type'){
                            return this.getUserFriendlyName(v);
                        }


                        if (Ext.isString(v)){
                            return Ext.String.format("\"{0}\"", v.toString().replace(/"/g, "\"\""));
                        }
                        return v;

                    }, this);
                    csv.push(row.join(','));
                }, this);
            }
        }, this);
        csv = csv.join('\r\n');
        this.logger.log('export csv', csv);

        var fileName = Ext.String.format("data-hygiene-{0}.csv",Rally.util.DateTime.format(new Date(), 'Y-m-d-h-i-s'));
        Rally.technicalservices.FileUtilities.saveCSVToFile(csv, fileName);
    },
    addExportButton: function(){

        var btn = this.getExportBox().add({
            xtype: 'rallybutton',
            iconCls: 'icon-export',
            cls: 'secondary rly-small'
        });
        btn.on('click', this.export, this);
    },
    _buildGrids: function(data){

       this.addExportButton();

       var typeHash = {};
        Ext.Array.each(data, function(d){
            if (!typeHash[d.type]){
                typeHash[d.type] = [];
            }
            typeHash[d.type].push(d);
        });
        this.logger.log('_buildGrids', data, typeHash);
        Ext.Object.each(typeHash, function(type, obj){
            this._buildSubGrid(type, obj);
        }, this);

    },
    _buildSubGrid: function(type, data){
        var fields = [];

        if (data && data.length > 0){
            fields = Ext.Object.getKeys(data[0]);
        }
        this.logger.log('_buildSubGrid', data, fields);
        var store = Ext.create('Rally.data.custom.Store',{
            data: data,
            fields: fields
        });

        var columnCfgs = [{
            dataIndex: 'ruleName',
            text: Ext.String.format('{0} level data hygiene', this.getUserFriendlyName(type)),
            flex: 1
        }];

        Ext.Array.each(fields, function(f){
            if (f !== 'type' && f !== 'ruleName') {
                columnCfgs.push({
                    dataIndex: f,
                    text: f,
                    align: 'center'
                });
            }
        });

        this.getGridBox().add({
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
    getProjectGroups: function(){
        var groups = [],
            group_setting = this.getSetting('projectGroups');
        if (!Ext.isArray(group_setting)){
            groups = Ext.JSON.decode(group_setting);
        } else {
            groups = group_setting;
        }
        return groups;
    },
    getGridBox: function(){
        return this.down('#grid_box');
    },
    getChartBox: function(){
        return this.down('#chart_box');
    },
    getExportBox: function(){
        return this.down('#selector_box');
    },
    _createValidator: function() {
        var rules = [{
            xtype:'tsportfolio_orphan',
            targetPortfolioLevel: 1,
            portfolioItemTypes: this.portfolioItemTypes,
            projectGroups: this.getProjectGroups()
        },{
            xtype: 'tsportfolio_project',
            targetPortfolioLevel: 1,
            portfolioItemTypes: this.portfolioItemTypes,
            portfolioProjects: [],
            projectGroups: this.getProjectGroups()
        },{
            xtype: 'tsportfolio_childstate',
            targetPortfolioLevel: 1,
            portfolioItemTypes: this.portfolioItemTypes,
            portfolioItemStates: this.portfolioItemStates,
            projectGroups: this.getProjectGroups()
        },{
            xtype: 'tsportfolio_fieldvalue',
            targetPortfolioLevel: 1,
            portfolioItemTypes: this.portfolioItemTypes,
            targetField: this.getPortfolioAOPField(),
            label: '{0}s with "AOP Approved" field checked',
            description: '{0}s with "AOP Approved" field checked',
            targetFieldValue: true,
            projectGroups: this.getProjectGroups()
        },{
            xtype: 'tsportfolio_fieldvalue',
            targetPortfolioLevel: 1,
            portfolioItemTypes: this.portfolioItemTypes,
            targetField: this.getPortfolioAOPField(),
            label: '{0}s with "AOP Approved" field <b>not</b> checked',
            description: '{0}s with "AOP Approved" field <b>not</b> checked',
            targetFieldValue: false,
            projectGroups: this.getProjectGroups()
        },{
            xtype:'tsportfolio_orphan',
            targetPortfolioLevel: 0,
            portfolioItemTypes: this.portfolioItemTypes,
            projectGroups: this.getProjectGroups()
        },{
            xtype: 'tsportfolio_project',
            targetPortfolioLevel: 0,
            portfolioItemTypes: this.portfolioItemTypes,
            projectGroups: this.getProjectGroups()
        },{
            xtype: 'tsportfolio_fieldvalue',
            targetPortfolioLevel: 0,
            portfolioItemTypes: this.portfolioItemTypes,
            targetField: this.getPortfolioCRField(),
            label: '{0}s with "CR" field checked',
            description: '{0}s with "CR" field checked',
            targetFieldValue: true,
            projectGroups: this.getProjectGroups()
        },{
            xtype: 'tsportfolio_fieldvalue',
            targetPortfolioLevel: 0,
            portfolioItemTypes: this.portfolioItemTypes,
            targetField: this.getPortfolioCRField(),
            label: '{0}s with "CR" field <b>not</b> checked',
            description: '{0}s with "CR" field <b>not</b> checked',
            targetFieldValue: false,
            projectGroups: this.getProjectGroups()
        },{
            xtype:'tsstory_orphan',
            portfolioItemTypes: this.portfolioItemTypes,
            projectGroups: this.getProjectGroups()
        },{
            xtype:'tsstory_project',
            projectGroups: this.getProjectGroups()
        },{
            xtype:'tsstory_planestimate',
            scheduleStates: this.scheduleStates,
            projectGroups: this.getProjectGroups()
        },{
            xtype:'tsstory_missingrelease',
            scheduleStates: this.scheduleStates,
            projectGroups: this.getProjectGroups()
        },{
            xtype:'tsstory_mismatchedrelease',
            portfolioItemTypes: this.portfolioItemTypes,
            scheduleStates: this.scheduleStates,
            projectGroups: this.getProjectGroups()
        },{
            xtype: 'tsstory_fieldvalue',
            targetField: this.getStoryCRField(),
            label: 'User Stories with "CR" field checked',
            description: 'User Stories with "CR" field checked',
            targetFieldValue: true,
            projectGroups: this.getProjectGroups()
        },{
            xtype: 'tsstory_fieldvalue',
            targetField: this.getStoryCRField(),
            label: 'User Stories with "CR" field <b>not</b> checked',
            description: 'User Stories with "CR" field <b>not</b> checked',
            targetFieldValue: false,
            projectGroups: this.getProjectGroups()
        }];

        var validator = Ext.create('CA.techservices.validator.Validator',{
                rules: rules,
                projectGroups: this.getProjectGroups()
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
        },{
            name: 'projectGroups',
            xtype:'tsstrategyexecutiongroupsettingsfield'
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
    }
});
