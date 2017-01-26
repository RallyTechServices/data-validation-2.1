Ext.define('CA.techservices.validation.StoryInProgressBeforeExecution',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_inprogressbeforeexecution',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        scheduleStates: null,
        executionState: 'Execution',

        model: 'HierarchicalRequirement',
        label: 'Stories "in progress" when Feature is not in "{0}" State or beyond',
        description: 'Stories "in progress" when Feature is not in "{0}" State or beyond'

    },
    getLabel: function(){
        return Ext.String.format(this.label, this.executionState);
    },
    getFilters: function() {

        var piKey = this.portfolioItemTypes[0].TypePath,
            piName = this.portfolioItemTypes[0].Name,
            states = this.portfolioItemStates[piKey],
            filters = [{
                property: piName + '.State',
                value: ""
            }];

        Ext.Array.each(states, function(state){
            if (state === this.executionState){
                return false;
            }
            filters.push({
                property: piName + '.State.Name',
                value: state
            });

        }, this);

        if (filters.length > 1){
            filters = Rally.data.wsapi.Filter.or(filters);
            filters = filters.and({
                property: 'ScheduleState',
                operator: ">",
                value: "Defined"
            });
        } else {
            filters.push({
                property: 'ScheduleState',
                operator: ">",
                value: "Defined"
            });
            filters = Rally.data.wsapi.Filter.and(filters);
        }
        console.log('filters', filters.toString());
        return filters;


    }
});