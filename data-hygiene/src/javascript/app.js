Ext.define("data-hygiene", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    integrationHeaders : {
        name : "data-hygiene"
    },

    items: [
        {xtype:'container',itemId:'selector_box', flex: 1, float: 'right', tpl: '<div class="no-data-container"><div class="secondary-message">{message}</div></div>'},
        {xtype:'container',itemId:'chart_box', flex: 1},
//        {xtype:'container',itemId:'grid_box'}
        {xtype:'container',itemId:'grid_box', flex: 1}
    ],


    config: {
        defaultSettings: {
            portfolioAOPField: 'c_AOP',
            portfolioCRField: 'c_CR',
            portfolioCRApprovalField: 'c_CRApprovedDate',
            userStoryCRField: 'c_CR',
            userStoryCRApprovalField: 'c_CRApprovedDate',
            showPrograms:[],
            // projectGroups: [],
            query: null,
            creationDateBefore: null,
            creationDateAfter: null,
            orFilter: false
        }
    },

    scheduleStates: null,
    portfolioItemTypes: null,
    portfolioItemStates: null,

    launch: function() {
        this.logger.log('launch Settings:', this.getSettings());
        // get any data model customizations ... then get the data and render the chart

        if (!this.getProjectGroups() || this.getProjectGroups().length === 0){
            this.down('#selector_box').update({message: "Please use the App Settings to configure at least 1 Program."});
            return;
        }

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

        //if (this.getProjectGroups() || this.getProjectGroups().length === 0){
        //    this.getExportBox().
        //}

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
        this.setLoading(true);
        this.validator = this._createValidator();
        var filters = this.getFilters();
        this.logger.log('_loadData', filters && filters.toString());
        this.validator.fetchData(filters).then({
            success: function(data){
                this.logger.log('_loadData.success', data);
                this._addChart(data);
                this._buildGrids(data);
            },
            failure: this._showErrorMsg,
            scope: this
        }).always(function() { me.setLoading(false); });
    },
    getFilters: function(){
        if (this.getSetting('query')){
            this.logger.log('getFilters queryString provided: ', this.getSetting('query'));
            return Rally.data.wsapi.Filter.fromQueryString(this.getSetting('query'));
        }

        var filters = [];
        if (this.getSetting('creationDateBefore')){
            this.logger.log('getFilters creationDateBefore provided: ', this.getSetting('creationDateBefore'));
            filters.push({
                property: 'CreationDate',
                operator: '<=',
                value: Rally.util.DateTime.toIsoString(new Date(this.getSetting('creationDateBefore')))
            });
        }

        if (this.getSetting('creationDateAfter')){
            this.logger.log('getFilters creationDateAfter provided: ', this.getSetting('creationDateAfter'));
            filters.push({
                property: 'CreationDate',
                operator: '>=',
                value: Rally.util.DateTime.toIsoString(new Date(this.getSetting('creationDateAfter')))
            });
        }
        if (filters.length > 1){
            var orFilters = this.getSetting('orFilter');
            if (orFilters === "true" || orFilters === true){
                filters = Rally.data.wsapi.Filter.or(filters);
            } else {
                filters = Rally.data.wsapi.Filter.and(filters);
            }
        }

        if (filters.length === 1){
            return Ext.create('Rally.data.wsapi.Filter',filters[0]);
        }

        if (filters.length === 0){
            return null;
        }
        return filters;
    },
    _addChart: function(chartData){
        this.logger.log('addChart', chartData);

        var projects = _.map(this.getProjectGroups(), function(pg){
            return pg.Name;
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
                ruleHash[cd.ruleName][p] = _.flatten(cd[p]).length;
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
            chartColors: CA.apps.charts.Colors.getConsistentBarColors(),
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
                        },
                         reversedStacks: false
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
            keys.push(pg.Name);
            headers.push(pg.Name);
        });

        Ext.Array.each(grids, function(grid){
            var records = grid.getStore() && grid.getStore().getRange();
            if (records && records.length > 0){
                csv.push(Ext.String.format("{0} Data Hygiene", this.getUserFriendlyName(records[0].get('type'))));
                csv.push(headers.join(','));
                Ext.Array.each(records, function(r){
                    var row = Ext.Array.map(keys, function(key){
                        var v = r.get(key) || 0;

                        if(v.constructor === Array){
                            return v.length
                        }
                        var v = r.get(key) || 0;
                        if (key == 'type'){
                            return this.getUserFriendlyName(v);
                        }
                        if (Ext.isString(v)){
//                            return Ext.String.format("\"{0}\"", v.toString().replace(/"/g, "\"\""));
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
        var me = this;
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
            width: 200
//            flex: 1
        }];

        Ext.Array.each(fields, function(f){
            if (f !== 'type' && f !== 'ruleName') {
                columnCfgs.push({
                    dataIndex: f,
                    text: f,
                    align: 'center',
                    renderer: function(value){
                        //return Ext.String.format('<a onclick="me.showDrillDown({0})">{1}</a>', _.flatten(value), _.flatten(value).length);
                        return _.flatten(value).length;
                    }
                });
            }
        });

        this.getGridBox().add({
            xtype: 'rallygrid',
            store: store,
            margin: 20,
//            maxWidth: 500,
            autoScroll: true,
//            overflowX: 'scroll',
            columnCfgs: columnCfgs,
            showPagingToolbar: false,
            showRowActionsColumn: false,
            viewConfig: {
                listeners: {
                    cellclick: this.showDrillDown,
                    scope: this
                }
            }
        });
    },

    showDrillDown: function(view, cell, cellIndex, record) {
        console.log('view, cell, cellIndex, record',view, cell, cellIndex, record);
        var me = this;
        var clickedDataIndex = view.panel.headerCt.getHeaderAtIndex(cellIndex).dataIndex;
        var ruleValue = record.get(clickedDataIndex);

        if(ruleValue.constructor != Array) return;

        var store = Ext.create('Rally.data.custom.Store', {
            data: _.flatten(ruleValue),
            pageSize: 2000
        });

        var title = record.data.ruleName + ' for ' + clickedDataIndex || ""


        Ext.create('Rally.ui.dialog.Dialog', {
            itemId    : 'detailPopup',
            title     : title,
            width     : Ext.getBody().getWidth() - 150,
            height    : Ext.getBody().getHeight() - 150,
            closable  : true,
            layout    : 'border',
            items     : [
                        {
                            xtype                : 'rallygrid',
                            itemId               : 'popupGrid',
                            region               : 'center',
                            layout               : 'fit',
                            sortableColumns      : true,
                            showRowActionsColumn : false,
                            showPagingToolbar    : false,
                            columnCfgs           : this.getDrillDownColumns(title),
                            store : store,
                            dockedItems: [{
                                xtype: 'toolbar',
                                dock: 'top',
                                items: [
                                    {
                                        xtype: 'button',
                                        text: 'Download CSV',
                                        listeners: {
                                            click: me._export_popup
                                        }
                                    }
                                ]
                            }]
                        }
                        ]
        }).show();
    },

    _export_popup: function(){
        var me = this;

        var grid = this.up('window').down('#popupGrid');

        if ( !grid ) { return; }

        //this.logger.log('_export',grid);

        var filename = Ext.String.format(this.up('window').title +'.csv');

        //this.up('window').setLoading("Generating CSV");
        Deft.Chain.sequence([
            function() { return Rally.technicalservices.FileUtilities._getCSVFromCustomBackedGrid(grid) }
        ]).then({
            scope: this,
            success: function(csv){
                if (csv && csv.length > 0){
                    Rally.technicalservices.FileUtilities.saveCSVToFile(csv,filename);
                } else {
                    Rally.ui.notify.Notifier.showWarning({message: 'No data to export'});
                }

            }
        }).always(function() { me.setLoading(false); });
    },

    getDrillDownColumns: function(title) {
        var columns =  [
            {
                dataIndex: 'FormattedID',
                text: "id",
                // renderer: function(m,v,r){
                //   return Ext.create('Rally.ui.renderer.template.FormattedIDTemplate').apply(r.data);
                // }
                renderer: function(value,meta,record){
                    return Ext.String.format("<a href='{0}' target='_new'>{1}</a>",Rally.nav.Manager.getDetailUrl(record.get('_ref')),value);
                },
                exportRenderer: function(value,meta,record) {
                    return value;
                }
            },
            {
                dataIndex : 'Name',
                text: "Name",
                flex: 2
            },
            {
                dataIndex : 'Owner',
                text: "Owner",
                renderer: function(value){
                    return value._refObjectName
                },
                flex: 1
            },
            {
                dataIndex : 'Project',
                text: "Project",
                renderer: function(value){
                    return value._refObjectName
                },
                flex: 1
            }
        ];

        if(title.indexOf('Stories with incorrect "Release" tag (does not match parent') > -1){
            columns.push({
                dataIndex : 'Release',
                text: "Story Release",
                renderer: function(value){
                    return value && value.Name
                },
                flex: 1
            });

            columns.push({
                dataIndex : 'Feature',
                text: "Feature",
                renderer: function(value){
                    return value && value.Name
                },
                flex: 1
            });

            columns.push({
                dataIndex : 'Feature',
                text: "Feature Release",
                renderer: function(value){
                    return value && value.Release && value.Release.Name
                },
                flex: 1
            });
        }


        if(title.indexOf('Stories with Project field value "Track"') > -1){

            columns.push({
                dataIndex : 'Feature',
                text: "Feature",
                renderer: function(value){
                    return value && value.Name
                },
                flex: 1
            });

            columns.push({
                dataIndex : 'Feature',
                text: "Feature State",
                renderer: function(value){
                    return value && value.State && value.State._refObjectName
                },
                flex: 1
            });
        }

        if(title.indexOf('Child Stories (Stories nested under other Stories)') > -1){

            columns.push({
                dataIndex : 'Parent',
                text: "Parent",
                renderer: function(value){
                    return value && value.Name
                },
                flex: 1
            });

        }
        return columns;
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
            name = 'Story';
        }
        return name;
    },
    getPortfolioAOPField: function(){
        return this.getSetting('portfolioAOPField');
    },
    getPortfolioCRField: function(){
        return this.getSetting('portfolioCRField');
    },
    getPortfolioCRApprovalField: function(){
        return this.getSetting('portfolioCRApprovalField');

    },
    getStoryCRField: function(){
        return this.getSetting('userStoryCRField');
    },
    getStoryCRApprovalField: function(){
        return this.getSetting('userStoryCRApprovalField');
    },
    getProjectGroups: function(){
        var groups = [],
            group_setting = this.getSetting('showPrograms');
        if (!Ext.isArray(group_setting)){
            groups = Ext.JSON.decode(group_setting);
        } else {
            groups = group_setting;
        }
        return Ext.Object.getValues(groups);
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
        },
        //{
        //    xtype: 'tsportfolio_fieldvalue',
        //    targetPortfolioLevel: 1,
        //    portfolioItemTypes: this.portfolioItemTypes,
        //    targetField: this.getPortfolioAOPField(),
        //    label: '{0}s with "AOP Approved" field checked',
        //    description: '{0}s with "AOP Approved" field checked',
        //    targetFieldValue: true,
        //    projectGroups: this.getProjectGroups()
        //},
        // {
        //     xtype: 'tsportfolio_fieldvalue',
        //     targetPortfolioLevel: 1,
        //     portfolioItemTypes: this.portfolioItemTypes,
        //     targetField: this.getPortfolioAOPField(),
        //     label: '{0}s not "AOP Approved"',
        //     description: '{0}s not "AOP Approved"',
        //     targetFieldValue: "No",
        //     projectGroups: this.getProjectGroups()
        // },
        {
            xtype:'tsportfolio_orphan',
            targetPortfolioLevel: 0,
            portfolioItemTypes: this.portfolioItemTypes,
            projectGroups: this.getProjectGroups()
        },{
            xtype: 'tsportfolio_project',
            targetPortfolioLevel: 0,
            portfolioItemTypes: this.portfolioItemTypes,
            projectGroups: this.getProjectGroups()
        },
        // {
        //     xtype: 'tsportfolio_fieldvalue',
        //     targetPortfolioLevel: 0,
        //     portfolioItemTypes: this.portfolioItemTypes,
        //     targetField: this.getPortfolioCRField(),
        //     label: '{0}s with "CR" field checked',
        //     description: '{0}s with "CR" field checked',
        //     targetFieldValue: true,
        //     projectGroups: this.getProjectGroups()
        //}
        // ,{
        //    xtype: 'tsportfolio_fieldvalue',
        //    targetPortfolioLevel: 0,
        //    portfolioItemTypes: this.portfolioItemTypes,
        //    targetField: this.getPortfolioCRField(),
        //    label: '{0}s with "CR" field <b>not</b> checked',
        //    description: '{0}s with "CR" field <b>not</b> checked',
        //    targetFieldValue: false,
        //    projectGroups: this.getProjectGroups()
        // },
        {
            xtype: 'tsportfolio_staterelease',
            portfolioItemTypes: this.portfolioItemTypes,
            portfolioItemStates: this.portfolioItemStates
        },{
            xtype: 'tsportfolio_statenostories',
            portfolioItemTypes: this.portfolioItemTypes,
            portfolioItemStates: this.portfolioItemStates
        },{
            xtype: 'tsportfolio_crcheckednoapproval',
            portfolioItemTypes: this.portfolioItemTypes,
            portfolioItemStates: this.portfolioItemStates,
            crField: this.getPortfolioCRField(),
            crApprovalField: this.getPortfolioCRApprovalField()
        },{
            xtype: 'tsportfolio_notexecutedinprogress',
            portfolioItemTypes: this.portfolioItemTypes,
            portfolioItemStates: this.portfolioItemStates
        },{
            xtype: 'tsstory_parent-canceled',
            portfolioItemTypes: this.portfolioItemTypes,
            projectGroups: this.getProjectGroups()
        },{
            xtype:'tsstory_orphan',
            portfolioItemTypes: this.portfolioItemTypes,
            projectGroups: this.getProjectGroups()
        },{
            xtype:'tsstory_children',
            portfolioItemTypes: this.portfolioItemTypes,
            projectGroups: this.getProjectGroups()
        },{
            xtype: 'tsstory_parents',
            projectGroups: this.getProjectGroups()
        },{
            xtype:'tsstory_project',
            projectGroups: this.getProjectGroups()
        },{
            xtype:'tsstory_project_track',
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
        },
        // {
        //     xtype: 'tsstory_fieldvalue',
        //     targetField: this.getStoryCRField(),
        //     label: 'Stories with "CR" field checked',
        //     description: 'Stories with "CR" field checked',
        //     targetFieldValue: true,
        //     projectGroups: this.getProjectGroups()
        // },
        //{
        //    xtype: 'tsstory_fieldvalue',
        //    targetField: this.getStoryCRField(),
        //    label: 'User Stories with "CR" field <b>not</b> checked',
        //    description: 'User Stories with "CR" field <b>not</b> checked',
        //    targetFieldValue: false,
        //    projectGroups: this.getProjectGroups()
        //},{
        //    xtype: 'tsstory_inprogressbeforeexecution',
        //    portfolioItemTypes: this.portfolioItemTypes,
        //    portfolioItemStates: this.portfolioItemStates
        //},
        {
            xtype: 'tsstory_inprogresscrcheckednoapproval',
            crField: this.getStoryCRField(),
            crApprovalField: this.getStoryCRApprovalField()
        }];

        var validator = Ext.create('CA.techservices.validator.Validator',{
                rules: rules,
                projectGroups: this.getProjectGroups()
        });
        return validator;
    },
    getSettingsFields: function(){
        var labelWidth = 175,
            orFilter = this.getSetting('orFilter') === "true" || this.getSetting('orFilter') === true;

        return [{
            xtype: 'container',
            margin: '25 0 0 0',
            html: '<div class="rally-upper-bold">Filter by Date</div>',
        },{
            xtype: 'rallydatefield',
            fieldLabel: 'Items created after',
            labelAlign: 'right',
            labelWidth: labelWidth,
            name: 'creationDateAfter'
        },{
            xtype: 'radiogroup',
            fieldLabel: ' ',
            // Arrange radio buttons into two columns, distributed vertically
            columns: 2,
            vertical: true,
            width: 200,
            items: [
                { boxLabel: 'AND', name: 'orFilter', inputValue: false, checked: !orFilter },
                { boxLabel: 'OR', name: 'orFilter', inputValue: true, checked: orFilter }
            ],
        }, {
            xtype: 'rallydatefield',
            labelAlign: 'right',
            labelWidth: labelWidth,
            fieldLabel: 'Items created before',
            name: 'creationDateBefore'
        }, {
            xtype: 'container',
            margin: '25 0 0 0',
            html: '<div class="rally-upper-bold">Programs</div>'
        },
        // {
        //     name: 'projectGroups',
        //     xtype:'tsstrategyexecutiongroupsettingsfield',
        //     fieldLabel: ' '
        // },
        {
            name: 'showPrograms',
            xtype:'tsprojectsettingsfield',
            fieldLabel: ' ',
            readyEvent: 'ready'
        },
        {
            xtype: 'textarea',
            fieldLabel: '<div class="rally-upper-bold">Filter by Query</div><em>Query fields must apply to all item types.  This filter will override the date filters above for all item types.</em>',
            labelAlign: 'top',
            name: 'query',
            anchor: '100%',
            cls: 'query-field',
            margin: '25 70 0 0',
            plugins: [
                {
                    ptype: 'rallyhelpfield',
                    helpId: 194
                },
                'rallyfieldvalidationui'
            ],
            validateOnBlur: false,
            validateOnChange: false,
            validator: function(value) {
                try {
                    if (value) {
                        Rally.data.wsapi.Filter.fromQueryString(value);
                    }
                    return true;
                } catch (e) {
                    return e.message;
                }
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
    }
});
