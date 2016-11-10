Ext.define('CA.technicalservices.validation.RuleTemplate', {
    extend: 'Ext.XTemplate',

    /**
     * This template expects a set of rules objects in the following format:
     * {
     *   bucket: <Project Name Bucket>
     *   rules: [{
     *      label: <Short rule Label>,
     *      description: <Rule description>,
     *      flaggedCount: <Count of flagged records>,
     *      totalCount: <Count of total records>,
     *      unitLabel: <plural unit label:  e.g. stories, people>
     *   }...]
     * }
     */

    constructor: function() {

        this.callParent([
            '<div class="dashboard-header">Financial Reporting Risks - {bucket}</div>',
            '<table class="dashboard-table"><tr></tr>',
            '<tpl for="rules">',
                '<tpl if="this.isRowBreak(xindex)"></tr><tr></tpl>',
                '<td class="dashboard-box">',
                    '<div class="{[this.getTitleClass(values)]}">{label}</div>',
                    '<div class="dashboard-percent-title">{[this.getPercentString(values)]}</div>',
                    '<div class="dashboard-subtitle">{flaggedCount} {unitLabel} out of {totalCount}</div>',
                    '<div class="dashboard-description">{description}</div>',
                '</td>',
            '</tpl>',
            '</tr></table>',
            {
                columns: 4,
                getPercentString: function(values){
                    var percent = this.getPercent(values);
                    if (percent === null){
                        return 'N/A';
                    }
                    return Ext.String.format('{0}%', percent.toFixed(1));
                },
                getPercent: function(values) {
                    return values.totalCount > 0 ? (values.flaggedCount / values.totalCount * 100) : null;
                },
                isRowBreak: function(col){
                    console.log('isRowBreak', col % this.columns);
                    if (col > this.columns && col % (this.columns + 1) === 0){
                        return true;
                    }
                    return false;
                },
                getTitleClass: function(values){
                    var percent = this.getPercent(values);
                    console.log('percent')
                    if (percent === null){
                        return 'dashboard-top dashboard-gray';
                    }

                    if (percent < 10){
                        return 'dashboard-top dashboard-green';
                    }
                    if (percent < 20){
                        return 'dashboard-top dashboard-yellow';
                    }
                    return 'dashboard-top dashboard-red';
                }
            }
        ]);
    }
});