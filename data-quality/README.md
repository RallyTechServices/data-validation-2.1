#Data Quality Apps

This folder contains 2 apps that show data quality 2 ways: 

## Data Exception Summary 
This app shows a table of the number of flagged items for each configured "rule".  The numbers are aggregated by team level.
This app aggregates by the first line of teams directly underneath the currently scoped Project/Team.  

Clicking on a number in the grid will load a detail grid of the flagged items represented by the number.  This grid can be used to make updates to the items.   

## Pretty Dashboard App
This app shows a visual display of % flagged items for each configured rule.  

Each rule block is colored according to configured thresholds for the percent of items that are flagged. 

###Development Notes
Both apps use the rulesConfig in the common/src/javascript/rules-config.js file.  
Changing the rulesConfig in this file will affect both apps once the app is rebuilt.  

####Configurations in this file

#####rulesConfig
This is an array of rule configurations.  Any rule configurations here will be displayed in both apps.  

Available configurations for each rule are: 
* label - This is the label used in the header of the pretty dashboard blocks and also the data exception summary grid
* description - The detailed description displayed in the pretty dashboard blocks and on the details panel of the data exception summary grid 
* model - the object type to be queried 
* unitLabel - this label is used only by the "pretty dashboard" and to indicate the x <unitlabel> our of y
* query - the query to get the number of flagged items 
* baseQuery (optional) - the query to get the total items - this is only used by the "Pretty" dashboard since it gets a total count as well as a flagged count
* detailFetchFields (optional) - this is only used by the data exception summary.  These are the default fields that are loaded when a person clicks on a number to see details of the flagged items

#####prettyDashboardColumns
Number of columns to display before a second line in the "Pretty" dashboard. 

#####prettyThreshholdGreen
Any rule with a % of flagged items under this number will be colored green.  

#####prettyThreshholdYellow
Any rule with a % of flagged items under this number, but on or above the prettyThreshholdGreen will be colored yellow.
Any rules with % on or above the prettyThreshholdYellow will be colored Red.    

#####prettyRules 
This is also an array of rule configurations.  
Any rule configurations here will only be shown in the "Pretty" dashboard but not in the data exception summary app.

#####drilldownRules
This is also an array of rule configurations.  
Any rule configurations here will only be shown in the Data exception summary app, but not in the "Pretty" dashboard.
