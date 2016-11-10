Ext.define('CA.techservices.validation.StoryMismatchedRelease',{
    extend: 'CA.techservices.validation.BaseRule',
    alias:  'widget.tsstory_mismatchedrelease',


    config: {
        /*
         * [{Rally.wsapi.data.Model}] portfolioItemTypes the list of PIs available
         * we're going to use the first level ones (different workspaces name their portfolio item levels differently)
         */
        scheduleStates: null,
        model: 'HierarchicalRequirement',
        label: 'Stories with incorrect "Release" tag (does not match parent {0})',
        description: 'Stories with incorrect "Release" tag (does not match parent {0})'
    },
    getFetchFields: function() {
        return [this._getFeatureName(),'Release','Name','DirectChildrenCount'];
    },
    _getFeatureName: function(){
        return this.portfolioItemTypes[0].TypePath.replace('PortfolioItem/','');
    },
    getLabel: function(){
        return Ext.String.format(this.label, this.portfolioItemTypes[0].Name);
    },
    getDescription: function(){
        return Ext.String.format(this.description, this.portfolioItemTypes[0].Name);
    },
    applyRuleToRecord: function(record) {

       var storyRelease = record.get('Release') && record.get('Release').Name || null,
           featureRelease = record.get(this._getFeatureName()) && record.get(this._getFeatureName()).Release &&
               record.get(this._getFeatureName()).Release.Name || null;

        if (featureRelease !== storyRelease && record.get('DirectChildrenCount') === 0) {
            return this.getDescription();
        }
        return null; // no rule violation
    //},
    //getFilters: function() {
    //    return Rally.data.wsapi.Filter.and([{
    //        property:'DirectChildrenCount',
    //        value: 0
    //    },{
    //        property: this._getFeatureName() + '.ObjectID',
    //        operator: '>',
    //        value: 0
    //    }]);
    }
});