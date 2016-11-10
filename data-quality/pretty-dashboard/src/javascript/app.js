Ext.define("data-quality-dashboard", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'message_box',tpl:'Hello, <tpl>{_refObjectName}</tpl>'},
        {xtype:'container',itemId:'display_box'}
    ],

    integrationHeaders : {
        name : "data-quality-dashboard"
    },

    launch: function() {
        this.createValidator()
    },
    createValidator: function(){

        var rules = Ext.Array.merge(
            CA.technicalservices.dataquality.common.Rules.rulesConfig,
            CA.technicalservices.dataquality.common.Rules.prettyRules
        );
        var validator = Ext.create('CA.technicalservices.validator.Validator',{
            bucket: this.getContext().getProject().Name,
            projectRef: this.getContext().getProject()._ref,
            rules: rules
        });

        this.setLoading(true);
        validator.run().then({
            failure: this.showErrorNotification,
            success: this.displayDashboard,
            scope: this
        }).always(function(){ this.setLoading(false); }, this);
    },
    displayDashboard: function(validator){
        this.removeAll();
        var tpl = Ext.create('CA.technicalservices.validation.RuleTemplate',{
            columns: CA.technicalservices.dataquality.common.Rules.prettyDashboardColumns
        });

        this.add({
            xtype: 'container',
            tpl: tpl,
            margin: '0 100 0 100',
            flex: 1
        }).update(validator);
    },
    showErrorNotification: function(msg){
        this.logger.log('showErrorNotification', msg);
        Rally.ui.notify.Notifier.showError({
            message: msg
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
