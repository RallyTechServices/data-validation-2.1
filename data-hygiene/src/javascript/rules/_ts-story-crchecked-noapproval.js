Ext.define('CA.techservices.validation.StoryInProgressCRCheckedNoApproval',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_inprogresscrcheckednoapproval',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        crField: null,
        crApprovalField: null,

        model: 'HierarchicalRequirement',
        label: 'Stories "In Progress" with CR Checked but no CR Approval',
        description: 'Stories "In Progress" with CR Checked but no CR Approval',
    },
    getFilters: function() {

        var filters = Rally.data.wsapi.Filter.and([{
            property: 'ScheduleState',
            operator: '>',
            value: 'Defined'
        },{
            property: this.crField,
            value: true
        },{
            property: this.crApprovalField,
            value: "null"
        }]);
        return filters;


    }
});