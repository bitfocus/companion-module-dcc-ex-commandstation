export function updateVariables() {
	let variables = []

	variables.push(
		{
			name: 'Device Model',
			variableId: 'model',
		},
		{
			name: 'Motor Shield',
			variableId: 'motor',
		},
		{
			name: 'DCC-EX Version',
			variableId: 'version',
		},
		{
			name: 'Power Status',
			variableId: 'power',
		},
		{
			name: 'Selected Loco DCC Address',
			variableId: 'locoAddress',
		}
	)
	this.setVariableDefinitions(variables)
}