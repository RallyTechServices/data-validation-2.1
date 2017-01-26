Ext.define('CA.technicalservices.dataquality.common.Rules',{
    singleton: true,

    prettyDashboardColumns: 4,
    prettyThreshholdGreen: 10,
    prettyThreshholdYellow: 20,

    rulesConfig: [{

        label: 'Orphaned Features',
        description: 'Counting only features identified as Build',
        model: 'PortfolioItem/Feature',
        unitLabel: 'features',
        query: '((Parent = null) AND (InvestmentCategory = "Build"))',
        detailFetchFields: ['FormattedID','Name','Parent','State'],
        flagRed: true,
        flagYellow: false
    },{

        label: 'Orphaned Stories',
        flagRed: false,
        flagYellow: false,
        description: 'Counting stories where:<br><li>Assigned Team a build percent != 0 (is > 0 or null). ' +
        '<li>Story is not in "Unelaborated" ScheduleState ' +
        '<li>Story Type is "Standard" or null' +
        '<li>Story has no Feature',
        unitLabel: 'stories',
        model: 'HierarchicalRequirement',
        detailFetchFields: ['FormattedID','Name','Feature','Parent','ScheduleState','c_StoryType'],
        query: '(((c_StoryType = "Standard") OR (c_StoryType = "")) AND (((Feature = null) AND (ScheduleState > "Unelaborated")) AND (Project.c_BuildPercent != 0)))'
    },{

        label: 'Stories not sized',
        flagRed: false,
        flagYellow: true,
        description: 'Counting stories where:<br><li>Assigned Team a build percent != 0 (is > 0 or null). ' +
        '<li>Parent Initiative has an Investment Category = "Build" ' +
        '<li>Parent Initiative state is "In-Progress" or "Staging" ' +
        '<li>Story schedule state is in "Defined", "In-Progress" or "Complete" ' +
        '<li>Story Plan Estimate is null ',
        unitLabel: 'stories',
        model: 'HierarchicalRequirement',
        detailFetchFields: ['FormattedID','Name','Feature','PlanEstimate','ScheduleState'],
        query: '((((((Feature.Parent.State.Name = "In-Progress") OR (Feature.Parent.State.Name = "Staging") AND (((ScheduleState = "Defined") OR (ScheduleState = "In-Progress")) OR (ScheduleState = "Completed"))) AND (Feature.Parent.InvestmentCategory = "Build")) AND (Project.c_BuildPercent != 0)) AND (PlanEstimate = ""))'

    },{

        label: 'Active Stories / Inactive Initiatives',
        watchColor: null,
        description: 'Counting stories where:<br><li>Assigned Team a build percent != 0 (is > 0 or null). ' +
        '<li>Parent Initiative has an Investment Category = "Build" ' +
        '<li>Parent Initiative is NOT active (state is NOT "In-Progress" or "Staging") ' +
        '<li>Story is active (schedule state is "Defined", "In-Progress" or "Complete") ' ,
        unitLabel: 'stories',
        model: 'HierarchicalRequirement',
        detailFetchFields: ['FormattedID','Name','Feature','ScheduleState'],
        query: '((((Feature.Parent.State.Name != "In-Progress") AND (Feature.Parent.State.Name != "Staging")) AND (((ScheduleState = "Defined") OR (ScheduleState = "In-Progress")) OR (ScheduleState = "Completed")) AND ((c_StoryType = "Standard") OR (c_StoryType = ""))) AND ((Feature.Parent.InvestmentCategory = "Build") AND (Project.c_BuildPercent != 0)))'

    },{

            label: 'Active Stories on Parent Teams',
        watchColor: null,
        description: 'Counting stories where:<br><li>Assigned Team a build percent != 0 (is > 0 or null). ' +
        '<li>Parent Initiative has an Investment Category = "Build" ' +
        '<li>Parent Initiative is active (state is "In-Progress" or "Staging") ' +
        '<li>Story state is active (state is "Defined", "In-Progress" or "Complete") ' ,
        unitLabel: 'stories',
        detailFetchFields: ['FormattedID','Name','Feature','ScheduleState','Project'],
        model: 'HierarchicalRequirement',
        query: '((((Feature.Parent.State.Name = "In-Progress") OR (Feature.Parent.State.Name = "Staging")) AND (((ScheduleState = "Defined") OR (ScheduleState = "In-Progress")) OR (ScheduleState = "Completed"))) AND (((Feature.Parent.InvestmentCategory = "Build") AND (Project.Children.State = "Open")) AND (Project.c_BuildPercent != 0)))'

    },{

        label: 'Strategy Category',
        watchColor: null,
        description: 'Counting initiatives where:<br>' +
        '<li>Initiative has an Investment Category = "Build" ' +
        '<li>Strategy Category is null',
        unitLabel: 'initiatives',
        detailFetchFields: ['FormattedID','Name','State','InvestmentCategory'],
        model: 'PortfolioItem/Initiative',
        query: '((InvestmentCategory = "Build") AND (c_StrategyCategory = ""))'

    },{

        label: 'Active Stories / Team with no people',
        watchColor: null,
        description: 'Counting stories where:<br>' +
        '<li>Initiative has an Investment Category = "Build" ' +
        '<li>Initiative is active (state is "In-Progress" or "Staging") ' +
        '<li>Story state is active (state is "Defined", "In-Progress" or "Complete") ' +
        '<li>Story is on a Team with no Team Members</li>',
        unitLabel: 'stories',
        model: 'HierarchicalRequirement',
        detailFetchFields: ['FormattedID','Name','Feature','ScheduleState','Project'],
        query: '((((Feature.Parent.State.Name = "In-Progress") OR (Feature.Parent.State.Name = "Staging")) AND (((ScheduleState = "Defined") OR (ScheduleState = "In-Progress")) OR (ScheduleState = "Completed"))) AND ((Feature.Parent.InvestmentCategory = "Build") AND (Project.TeamMembers.ObjectID = "null")))'

    },{

        label: 'Features not sized',
        watchColor: null,
        description: 'Counting features where:' +
        '<li>Initiative is Build' +
        '<li>Initiative is active (state is "In-Progress" or "Staging")' +
        '<li>Preliminary Estimate is null',
        model: 'PortfolioItem/Feature',
        unitLabel: 'features',
        detailFetchFields: ['FormattedID','Name','Parent','PreliminaryEstimate','State','Project'],
        query: '((((Parent.State.Name = "In-Progress") OR (Parent.State.Name = "Staging")) AND (Parent.InvestmentCategory = "Build")) AND (PreliminaryEstimate = ""))'
    }],


    //Add rules to this array that you only want on the "Pretty" dashboard and not in the drilldown app
    prettyRules: [{
        label: 'Misaliged Feature / Intiative Investment Category',
        description: 'Counting features where:' +
        '<li>Initiative Investment Category is "Build"' +
        '<li>Initiative is active (state is "In-Progress" or "Staging")' +
        '<li>Feature Investment Category is NOT "Build"',
        model: 'PortfolioItem/Feature',
        unitLabel: 'features',
        detailFetchFields: ['FormattedID','Name','Parent','InvestmentCategory','State','Project'],
        query: '(((((Parent.State.Name = "Elaborate") OR (Parent.State.Name = "In-Progress")) OR (Parent.State.Name = "Staging")) AND (Parent.InvestmentCategory = "Build")) AND (InvestmentCategory != "Build"))'

    }],

    //Add rules to this array that you only want in the "Drilldown App" but not on the "Pretty" dashboard.
    drilldownRules: [{
        label: 'Build Percent null',
        description: 'Counting leaf node projects where the Build Percent field is null',
        model: 'Project',
        detailFetchFields: ['Name','c_BuildPercent'],
        query: '((c_BuildPercent = "") AND (Children.State != "Open"))',
        exceptionClass: 'rule_leafprojectbuildpercentrule'
    },{
        label: 'Teams assignment is inconsistent between Owner and Story',
        description: 'Counting Active stories and child stories where the project object id is different than the value in the Workday Team on the owners person record.  Data will not include stories with Owners that do not belong to a Workday Team',
        model: 'HierarchicalRequirement',
        detailFetchFields: ['ObjectID','Name','Owner','Project'],
        query: '((((ScheduleState = "Defined") OR (ScheduleState = "In-Progress")) OR (ScheduleState = "Completed")) AND (Owner.c_WorkdayTeam != ""))',
        exceptionClass: 'rule_teamassignmentinconsistency'
    }]

});