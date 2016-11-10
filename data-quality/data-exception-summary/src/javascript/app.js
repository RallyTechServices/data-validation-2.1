Ext.define("data-exception-summary", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    integrationHeaders : {
        name : "data-exception-summary"
    },

    layout: 'hbox',
    items: [
        {xtype:'container', itemId:'grid_box', flex: 1},
        {xtype:'container', itemId:'detail_box'}
    ],

    config: {
        defaultSettings: {
            projectBuildPercentField: 'c_BuildPercent'
        }
    },

    launch: function() {
       this._initializeApp();
    },
    _initializeApp: function(){

        this.projectUtility = Ext.create('CA.technicalservices.utils.ProjectUtilities',{
            fetch: [this.getSetting('projectBuildPercentField')],
            listeners: {
                onerror: this.showErrorNotification,
                ready: this.initializeValidator,
                scope: this
            }
        });
    },
    showErrorNotification: function(msg){
        Rally.ui.notify.Notifier.showError({message:msg});
    },
    initializeValidator: function(){
        var me = this;

        this.validator = this._createValidator();

        Deft.Chain.pipeline([
            function() {
                me.setLoading("Counting data...");
                return me.validator.getGridData();
            }
        ]).then({
            scope: this,
            success: function(results) {
                this.logger.log('_loadData results', results);
                this._buildGrid(results);
            },
            failure: function(msg) {
                Ext.Msg.alert('Problem loading data', msg);
            }
        }).always(function() { me.setLoading(false); });
    },

    _buildGrid: function(data){

        if (!data || data.length === 0){
            Rally.ui.notify.Notifier.showMessage({message: "No data to display."});
            return;
        }

        var fields = Ext.Object.getKeys(data[0]);

        var store = Ext.create('Rally.data.custom.Store',{
            data: data,
            fields: fields
        });

        var columnCfgs = [{
            dataIndex: 'bucket',
            text: 'Team',
            flex: 1
        }];

        Ext.Array.each(fields, function(f){
            if (f !== 'bucket' && f !== 'bucketID') {
                columnCfgs.push({
                    dataIndex: f,
                    text: f,
                    renderer: function(v,m){
                        m.tdCls = 'drilldown';
                        return v.value;
                    },
                    cls: 'drilldown',
                    doSort: function(direction){
                        var ds = this.up('rallygrid').getStore();
                        ds.sort({
                            property: f,
                            direction: direction,
                            sorterFn: function(v1, v2){
                                var a = v1.get(f) && v1.get(f).value || 0,
                                    b = v2.get(f) && v2.get(f).value || 0;
                                return a > b ? 1 : (a < b ? -1 : 0);
                            }
                        });
                    }
                });
            }
        });
        this.getGridBox().removeAll();
        this.getGridBox().add({
            xtype: 'rallygrid',
            store: store,
            margin: 20,
            columnCfgs: columnCfgs,
            showPagingToolbar: false,
            showRowActionsColumn: false,
            viewConfig: {
                listeners: {
                    cellclick: this.showDetails,
                    scope: this
                }
            }
        });

    },
    getDetailBox: function(){
        return this.down('#detail_box');
    },
    getGridBox: function(){
        return this.down('#grid_box');
    },
    _createValidator: function() {

        var rules = Ext.Array.merge(
            CA.technicalservices.dataquality.common.Rules.rulesConfig,
            CA.technicalservices.dataquality.common.Rules.drilldownRules
        );
        this.logger.log('_createValidator', rules);
        var validator = Ext.create('CA.techservices.validator.Validator',{
            rules: rules,
            projectUtility: this.projectUtility,
            currentProject: this.getContext().getProject().ObjectID,
            fetchFields: ['FormattedID','ObjectID','Project']
        });
        return validator;
    },
    showDetails: function(view, cell, cellIndex, record) {
        this.logger.log('showDetails', view, record);

        var clickedDataIndex = view.panel.headerCt.getHeaderAtIndex(cellIndex).dataIndex;
        var ruleValue = record.get(clickedDataIndex);

        if (!Ext.isObject(ruleValue)){
            return;
        }

        var projectRef = '/project/' + record.get('bucketID'),
            projectName = record.get('bucket'),
            context = this.getContext(),
            rule = Ext.create('CA.technicalservices.dataquality.common.BaseRule', ruleValue.ruleConfig),
            modelNames = [rule.getModel()];
        this.logger.log('showDetails modelNames', modelNames);

        var box = this.getDetailBox();
        box.removeAll();

        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: modelNames,
            enableHierarchy: true,
            fetch: rule.getDetailFetchFields(),
            filters: rule.getFilters(),
            context: {
                project: projectRef,
                projectScopeDown: true
            }
        }).then({
            success: function(store) {

                box.add({
                    xtype:'panel',
                    ui: 'info-box',
                    hideCollapseTool: true,
                    collapsible: true,
                    collapsed: false,
                    collapseDirection: 'right',
                    headerPosition: 'left',
                    header: true,
                    cls: 'detail-panel',
                    width: this.getWidth() *.90,
                    height: this.getHeight(),
                    padding: 10,
                    overflowY: 'auto',
                    items: [{
                        xtype: 'container',
                        flex: 1,
                        layout: 'hbox',
                        items: [{
                            xtype: 'rallybutton',
                            cls: 'detail-collapse-button icon-leave',
                            width: 18,
                            margin: '0 10 0 25',
                            userAction: 'Close (X) filter panel clicked',
                            listeners: {
                                click: function() {
                                    //this.up('panel').collapse();
                                    this.up('panel').destroy();
                                }
                            }
                        },{
                            xtype: 'container',
                            flex: 1,
                            html: Ext.String.format('<div class="rule-title">{0}: {1}  ({3} results)</div><div class="rule-description">{2}</div>',projectName, rule.getLabel(),rule.getDescription(), ruleValue.value)
                        }]
                    },{
                        xtype: 'rallygridboard',
                        context: context,
                        modelNames: modelNames,
                        toggleState: 'grid',
                        plugins: [{
                            ptype: 'rallygridboardinlinefiltercontrol',
                            inlineFilterButtonConfig: {
                                stateful: true,
                                stateId: context.getScopedStateId('filter-' + ruleValue.id),
                                modelNames: modelNames,
                                inlineFilterPanelConfig: {
                                    quickFilterPanelConfig: {
                                        defaultFields: [
                                            'ArtifactSearch',
                                            'Owner',
                                            'Project'
                                        ]
                                    }
                                }
                            }
                        },{
                            ptype: 'rallygridboardfieldpicker',
                            headerPosition: 'left',
                            modelNames: modelNames,
                            stateful: true,
                            stateId: context.getScopedStateId('columns-' + ruleValue.id)
                        },{
                            ptype: 'rallygridboardactionsmenu',
                            menuItems: [
                                {
                                    text: 'Export...',
                                    handler: function() {
                                        window.location = Rally.ui.gridboard.Export.buildCsvExportUrl(
                                            this.down('rallygridboard').getGridOrBoard());
                                    },
                                    scope: this
                                }
                            ],
                            buttonConfig: {
                                iconCls: 'icon-export'
                            }
                        }],
                        gridConfig: {
                            store: store,
                            storeConfig: {
                                filters: rule.getFilters(),
                                pageSize: 10,
                                context: {
                                    project: projectRef,
                                    projectScopeDown: true
                                }
                            },
                            columnCfgs: rule.getDetailFetchFields()

                        },
                        height: this.getHeight()
                    }]
                });

                //This is after we add the grid so that it doesn't try to update when we first load the grid
                //kc commented out -- this is killing performance.
                //store.on('update', function(){
                //    this.validator.refreshRecord(record);
                //}, this);

            },
            scope: this
        });
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
