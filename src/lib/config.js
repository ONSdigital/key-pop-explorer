import metadata from './metadata.json';
import outputClassificationsCategorised from './output-classifications-categorised';
import populationBases_ from "$lib/population-bases.json";
import mapStyle_ from "$lib/map-style.json";

export const populationBases = populationBases_;

const allClassifications = metadata.allUsedClassifications;
const inputClassifications = metadata.inputClassifications;
const outputClassifications = metadata.outputClassificationsWithDetails;

// CORE CONFIG
export const themes = {
	'light': {
		'name': 'light',
		'text': '#222',
		'muted': '#777',
		'pale': '#f0f0f0',
		'background': '#fff'
	},
	'dark': {
		'name': 'dark',
		'text': '#fff',
		'muted': '#bbb',
		'pale': '#333',
		'background': '#222'
	}
};

// Analytics config
export const analyticsProps = {
	"contentTitle": "Create a population group profile",
	"releaseDate": "20231024",
	"contentType": "exploratory",
	"outputSeries": "populationgroupprofiles"
};

export const texts = {
	comparison: 'vs whole population',
	nodata: 'Data not available.',
	blocked: 'Data not available.'
};

export const colors = {
	cat: ['#206095', '#A8BD3A', '#003C57', '#27A0CC', '#118C7B', '#F66068', '#746CB1', '#22D0B6', 'lightgrey'],
	seq: ["#d5f690", "#5bc4b1", "#2e9daa", "#0079a2", "#005583"],
	nodata: "lightgrey"
};

// Where outputClassifications includes a nice name for the classification,
// override the official name from the metadata.
// Also, add population bases to the metadata.
outputClassifications.forEach(c => {
	const classification = allClassifications[c.code];
	if (c.label !== null) {
		classification.label = c.label;
	}
	classification.populationBase = c.populationBase;
});

export const codes = {};
outputClassifications.forEach(c => {
	const classification = allClassifications[c.code];
	if (c.categories == null) {
		codes[classification.id] = classification.categories
			.filter(d => d.id !== '-8' && d.id !== '-9')
			.map(d => ({ label: d.label, cells: [d.id] }));
	} else {
		codes[classification.id] = c.categories;
	}
});

// The datasets used for charts
export let datasets = [
	{
		key: 'residents',
		code: 'Usual-Residents',
		tables: []
	}
];

outputClassifications.forEach(c => {
	const classification = allClassifications[c.code];
	datasets[0].tables.push({
		key: classification.label,
		code: classification.id,
		populationBase: classification.populationBase
	});
});


datasets[0].tablesCategorised = outputClassificationsCategorised.map(category => {
	const tables = category.classification_codes.map(code => {
		const classification = allClassifications[code];
		return {
			key: classification.label,
			code: classification.id,
			populationBase: classification.populationBase
		};
	});
	return {
		categoryName: category.category_name,
		categoryDescription: category.category_description,
		qualityInformationHtml: category.quality_information_html,
		shouldBeDisplayed: !("display" in category) || category.display,
		tables
	};
});

export let vars = [];

inputClassifications.forEach(c => {
	c = allClassifications[c];
	c.label = c.label.replace('Disability - Equality act disabled', 'Disability');
	vars.push({
		label: c.label,
		shortLabel: c.label.replace(new RegExp(" \\(.*$"), ""),
		key: c.id,
		cats: c.categories.filter(d => d.id !== '-8').map(d => ({
			var: c.id,
			code: d.id,
			label: d.label,
			newFormat: true
		}))
	});
});

vars.sort((a, b) => a.label.localeCompare(b.label));

function nestVars(vars) {
	var shortLabels = new Set(vars.map(v => v.shortLabel));
	var nested = {};
	for (let v of vars) {
		nested[v.shortLabel] ||= [];
		nested[v.shortLabel].push(v);
	}
	let result = [];
	for (let label of shortLabels) {
		nested[label].sort((a, b) => a.cats.length - b.cats.length);
		result.push({ label, vars: nested[label] });
	}
	return result;
}

export let varsNested = nestVars(vars);

export const mapStyle = mapStyle_;
export const mapBounds = [-6.3603, 49.8823, 1.7637, 55.8112];
export const maxBounds = [-9.5, 47, 4.5, 61];
export const ladBounds = {
	url: "/data/ltla2021.json",
	layer: "ltla",
	code: "areacd",
	name: "areanm"
}
