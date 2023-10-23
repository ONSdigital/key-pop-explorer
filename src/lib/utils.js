import { feature } from 'topojson-client';

import { maskRanges, codes } from "$lib/config";

import accessibleSpreadsheetCreator from "accessible-spreadsheet-creator";

const endpoint = "https://ons-dp-prod-cdn.s3.eu-west-2.amazonaws.com/maptiles/pgp-data/";

function getSelString(sel) {
  let selected = [...sel].sort((a, b) => a.key.localeCompare(b.key));
  let selString = sel.length == 0 ?
    "data" :
    selected.map((s, i) => {
      if (i < selected.length - 1)
        return `${s.key}-${s.code}`;
      else
        return `${s.key}`;
    }).join('/');
  return {
    selString,
    lastCode: sel.length > 0 ? selected[selected.length - 1].code : null
  };
}

export async function getData(datasets, sel = [], fetch = window.fetch) {
  if (sel.length > 0 && !sel[0].newFormat) {
    throw new Error("OLD FORMAT!");
  }

  let { selString, lastCode } = getSelString(sel);
  let retval = { data: {} };

  let barChartData;
  if (sel.length === 0) {
    let url = `${endpoint}${sel.length}var_percent/${selString}.json`
    let response = await fetch(url);
    barChartData = await response.json();
    retval.total_pop = { count: barChartData.sex.count[0] + barChartData.sex.count[1], percent: 100 };
  } else {
    let url = `${endpoint}${sel.length}var-combined_percent/${selString}.json`
    let response = await fetch(url);
    let json = await response.json();
    barChartData = json.bar_chart_data[lastCode];
    retval.mapData = json.map_data[lastCode];
    retval.total_pop = barChartData.total_pop;
  }

  for (let dataset of datasets) {
    retval.data[dataset.key] = {};
    for (let table of dataset.tables) {
      retval.data[dataset.key][table.code] = { values: barChartData[table.code] };
    }
  }

  return retval;
}

export function getColor(value, breaks, colors) {
  for (let i = 1; i < breaks.length; i++) {
    if (value <= breaks[i]) {
      return colors[i - 1];
    }
  }
}

export async function getTopo(url, layer, fetch = window.fetch) {
  let response = await fetch(url);
  let json = await response.json();
  let geojson = await feature(json, layer);
  return geojson;
}

export function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function removeCategoryCountFromName(name) {
  return name.replace(new RegExp(" \\([0-9]* categories\\)"), "");
}

export function computeAgeMaskRange(selected) {
  for (const s of selected)
    if (s.var in maskRanges) return maskRanges[s.var][s.code];

  return null;
}

export const religionComparatorByName = (a, b) => {
  if (a.label === b.label) return 0;
  if (a.label === "Not answered") return 1;
  if (b.label === "Not answered") return -1;
  if (a.label === "Other religion") return 1;
  if (b.label === "Other religion") return -1;
  return a.label.localeCompare(b.label, "en-GB");
};

export function makeDataNew(group, dataset, data) {
  let valsAll = data.all[group][dataset].values;
  let valsSelected = data.selected[group][dataset].values;

  let arr = [];

  let datasetCodes = codes[dataset].map((cd, i) => ({ ...cd, index: i }));
  if (dataset === "religion_tb") {
    datasetCodes = [...datasetCodes].sort(religionComparatorByName);
  }

  datasetCodes.forEach((cd) => {
    let label = cd.label;
    let valAll = valsAll.percent[cd.index];
    let valSelected = valsSelected.percent[cd.index];
    if (data.selected.total_pop != data.all.total_pop)
      arr.push({ group: "This group", category: label, value: valSelected });
    arr.push({ group: "Whole population", category: label, value: valAll });
  });

  return arr;
}

export function calcPopPercentString(percentage) {
  if (percentage === 100) return "100";
  const pctString = percentage.toFixed(1);
  if (pctString !== "0.0") return pctString;
  return "Less than 0.05";
}

export function trimLabel(label) {
  return label.split(": ").slice(-1)[0];
}

export function chartIsAvailable(tableCode, data) {
  const values = data.selected.residents[tableCode].values;
  return values !== "blocked"
    && values !== undefined
    && values.percent[0] != null;
}

function createCoverSheetContents(selected) {
  let coverSheetContents = [
    "This spreadsheet contains the data for a profile generated using the tool 'Create a population group profile' on the Office for National Statistics website.",
    `[View this profile on the ONS website](${document.location.href})`,
    "## Source",
    "Census 2021 from the Office for National Statistics",
    "## Selected population group",
    "This profile is for people who share the following characteristic" + (selected.length > 1 ? 's.' : '.'),
    ...selected.map(item => ` - ${item.longLabel}: ${trimLabel(item.label)}`),
    "## More Census data",
    "[Other census datasets are available on the ONS website.](https://www.ons.gov.uk/census)",
    "## Contact",
    "[Email Census Customer Services](mailto:census.customerservices@ons.gov.uk?subject=Create%20a%20population%20group%20profile)",
    "Phone +44 1329 444972"
  ];

  return coverSheetContents;
}

function makeSheetIntroText(table, selected) {
  //table, codes[table.code]
  let sheetIntroText = [
    "Source: Census 2021 from the Office for National Statistics",
  ];

  if (table.code === "resident_age_18b" && selected.some(d => d.topic === "Age")) {
    sheetIntroText.push("Note: the data in this table is not filtered by the selected age range ("
      + selected.filter(d => d.topic === "Age")[0].label + ').');
  }

  if (codes[table.code].some(d => d.cells.length > 1)) {
    sheetIntroText.push(`The data on this sheet is based on  the variable "${table.key}" (${table.code}).`);
    sheetIntroText.push(`Some categories have been merged to create the ${codes[table.code].length} categories shown.`);
  }

  return sheetIntroText;
}

export function createOdsZipFiles(data, datasets, selected) {
  const odsData = {
    coverSheetTitle:
      "Data Downloaded from 'Create a Population Group Profile'",
    coverSheetContents: createCoverSheetContents(selected),
    tableHeadings: [
      "Category",
      "Selected group %",
      "England and Wales %",
      "Selected group count",
      "England and Wales count",
    ],
    sheets: [],
  };

  odsData.sheets.push({
    sheetName: "Total population",
    tableName: "total_population",
    sheetIntroText: [
      "Source: Census 2021 from the Office for National Statistics",
    ],
    columns: [
      {
        heading: "Group",
        style: "text",
        values: ["Selected group"],
      },
      {
        heading: "Count",
        style: "number_with_commas",
        values: [data.selected.total_pop.count],
      },
      {
        heading: "% of England and Wales population",
        style: "number_1dp",
        values: [data.selected.total_pop.percent],
      },
    ],
  });

  let geoPerc = data.geoPerc.filter((d) => d.value != null)
    .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
  if (geoPerc.length > 0) {
    odsData.sheets.push({
      sheetName: "Percentage of Population, by Local Authority",
      tableName: "percentage_of_population",
      sheetIntroText: [
        "Source: Census 2021 from the Office for National Statistics",
      ],
      columns: [
        {
          heading: "Local Authority",
          style: "text",
          values: geoPerc.map((d) => d.name),
        },
        {
          heading: "% of Local Authority Population",
          style: "number_1dp",
          values: geoPerc.map((d) => d.value),
        },
        {
          heading: "Count",
          style: "number_with_commas",
          values: geoPerc.map((d) => d.count),
        },
      ],
    });
  }
  for (let table of datasets[0].tables) {
    if (table.code === "resident_age_23a") continue;
    if (!chartIsAvailable(table.code, data)) continue;
    if (data.selected.residents[table.code].values == null) continue;
    let sheet = {
      sheetName: removeCategoryCountFromName(table.key).replace('Age (B)', 'Age'),
      tableName: table.code,
      sheetIntroText: makeSheetIntroText(table, selected),
      columns: [
        {
          heading: "Category",
          style: "text",
          values: codes[table.code].map((d) => d.label),
        },
        {
          heading: "Selected group\n(%)",
          style: "number_1dp",
          values: data.selected.residents[table.code].values.percent,
        },
        {
          heading: "England and Wales\n(%)",
          style: "number_1dp",
          values: data.all.residents[table.code].values.percent,
        },
        {
          heading: "Selected group\n(count)",
          style: "number_with_commas",
          values: data.selected.residents[table.code].values.count,
        },
        {
          heading: "England and Wales\n(count)",
          style: "number_with_commas",
          values: data.all.residents[table.code].values.count,
        },
      ],
    };
    odsData.sheets.push(sheet);
  }

  return accessibleSpreadsheetCreator(odsData);
}