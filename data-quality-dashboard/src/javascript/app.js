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

    rules: [{
        label: 'Orphaned Features',
        description: 'Counting only features identified as Build',
        model: 'PortfolioItem/Feature',
        unitLabel: 'features',
        query: '((Parent = null) AND (InvestmentCategory = "Build"))'
    },{
        label: 'Orphaned Stories',
        description: 'Counting stories where:<br><li>Assigned Team a build percent != 0 (is > 0 or null). ' +
        '<li>Story is not in "Unelaborated" ScheduleState ' +
        '<li>Story Type is "Standard" or null' +
        '<li>Story has no Feature',
        unitLabel: 'stories',
        model: 'HierarchicalRequirement',
        query: '(((c_StoryType = "Standard") OR (c_StoryType = "")) AND (((Feature = null) AND (ScheduleState > "Unelaborated")) AND (Project.c_BuildPercent != 0)))'
    },{
        label: 'Stories not sized',
        description: 'Counting stories where:<br><li>Assigned Team a build percent != 0 (is > 0 or null). ' +
        '<li>Parent Initiative has an Investment Category = "Build" ' +
        '<li>Parent Initiative state is "In-Progress" or "Staging" ' +
        '<li>Story schedule state is in "Defined", "In-Progress" or "Complete" ' +
        '<li>Story Plan Estimate is null ',
        unitLabel: 'stories',
        model: 'HierarchicalRequirement',
        query: '((((((Feature.Parent.State.Name = "In-Progress") OR (Feature.Parent.State.Name = "Staging") AND (((ScheduleState = "Defined") OR (ScheduleState = "In-Progress")) OR (ScheduleState = "Completed"))) AND (Feature.Parent.InvestmentCategory = "Build")) AND (Project.c_BuildPercent != 0)) AND (PlanEstimate = ""))'
    },{
        label: 'Active Stories / Inactive Initiatives',
        description: 'Counting stories where:<br><li>Assigned Team a build percent != 0 (is > 0 or null). ' +
        '<li>Parent Initiative has an Investment Category = "Build" ' +
        '<li>Parent Initiative is NOT active (state is NOT "In-Progress" or "Staging") ' +
        '<li>Story is active (schedule state is "Defined", "In-Progress" or "Complete") ' ,
        unitLabel: 'stories',
        model: 'HierarchicalRequirement',
        query: '((((Feature.Parent.State.Name != "In-Progress") AND (Feature.Parent.State.Name != "Staging")) AND (((ScheduleState = "Defined") OR (ScheduleState = "In-Progress")) OR (ScheduleState = "Completed")) AND ((c_StoryType = "Standard") OR (c_StoryType = ""))) AND ((Feature.Parent.InvestmentCategory = "Build") AND (Project.c_BuildPercent != 0)))'
    },{
        label: 'Active Stories on Parent Teams',
        description: 'Counting stories where:<br><li>Assigned Team a build percent != 0 (is > 0 or null). ' +
        '<li>Parent Initiative has an Investment Category = "Build" ' +
        '<li>Parent Initiative is active (state is "In-Progress" or "Staging") ' +
        '<li>Story state is active (state is "Defined", "In-Progress" or "Complete") ' ,
        unitLabel: 'stories',
        model: 'HierarchicalRequirement',
        query: '((((Feature.Parent.State.Name = "In-Progress") OR (Feature.Parent.State.Name = "Staging")) AND (((ScheduleState = "Defined") OR (ScheduleState = "In-Progress")) OR (ScheduleState = "Completed"))) AND (((Feature.Parent.InvestmentCategory = "Build") AND (Project.Children.State = "Open")) AND (Project.c_BuildPercent != 0)))'
    },{
        label: 'Strategy Category',
        description: 'Counting initiatives where:<br>' +
        '<li>Initiative has an Investment Category = "Build" ' +
        '<li>Strategy Category is null',
        unitLabel: 'initiatives',
        model: 'PortfolioItem/Initiative',
        query: '((InvestmentCategory = "Build") AND (c_StrategyCategory = ""))'
    }, {
        label: 'Active Stories / Team with no people',
        description: 'Counting stories where:<br>' +
        '<li>Initiative has an Investment Category = "Build" ' +
        '<li>Initiative is active (state is "In-Progress" or "Staging") ' +
        '<li>Story state is active (state is "Defined", "In-Progress" or "Complete") ' +
        '<li>Story is on a Team with no Team Members</li>',
        unitLabel: 'stories',
        model: 'HierarchicalRequirement',
        query: '((((Feature.Parent.State.Name = "In-Progress") OR (Feature.Parent.State.Name = "Staging")) AND (((ScheduleState = "Defined") OR (ScheduleState = "In-Progress")) OR (ScheduleState = "Completed"))) AND ((Feature.Parent.InvestmentCategory = "Build") AND (Project.TeamMembers.ObjectID = "null")))'
    },{
        label: 'Features not sized',
        description: 'Counting features where:' +
        '<li>Initiative is Build' +
        '<li>Initiative is active (state is "In-Progress" or "Staging")' +
        '<li>Preliminary Estimate is null',
        model: 'PortfolioItem/Feature',
        unitLabel: 'features',
        query: '((((Parent.State.Name = "In-Progress") OR (Parent.State.Name = "Staging")) AND (Parent.InvestmentCategory = "Build")) AND (PreliminaryEstimate = ""))'
    }],

//misaligned features/intiiative investment category
    //(((((Parent.State.Name = "Elaborate") OR (Parent.State.Name = "In-Progress")) OR (Parent.State.Name = "Staging")) AND (Parent.InvestmentCategory = "Build")) AND (InvestmentCategory != "Build"))

    launch: function() {
        this.validator = this.createValidator()
        //this.displayDashboard(this.validator);
    },
    createValidator: function(){
        //var validator = {
        //    bucket: 'Bucket',
        //    rules: [{
        //        label: 'this is a label',
        //        description: 'this is a description',
        //        unitLabel: 'stories',
        //        flaggedCount: 5,
        //        totalCount: 54
        //    },{
        //        label: 'this is a label',
        //        description: 'this is a description',
        //        unitLabel: 'stories',
        //        flaggedCount: 3,
        //        totalCount: 54
        //    },{
        //        label: 'this is a label',
        //        description: 'this is a description',
        //        unitLabel: 'stories',
        //        flaggedCount: 2,
        //        totalCount: 54
        //    }]
        //};
        //return validator;

        var validator = Ext.create('CA.technicalservices.validator.Validator',{
            bucket: this.getContext().getProject().Name,
            projectRef: this.getContext().getProject()._ref,
            rules: this.rules
        });

        validator.run().then({
            failure: this.showErrorNotification,
            success: this.displayDashboard,
            scope: this
        });
    },
    displayDashboard: function(validator){
        this.removeAll();
        var tpl = Ext.create('CA.technicalservices.validation.RuleTemplate');

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
