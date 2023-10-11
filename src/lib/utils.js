import { feature } from 'topojson-client';

import { maskRanges, codes } from "$lib/config";

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
    lastCode: sel.length > 0 ? selected[selected.length-1].code : null
  };
}

export async function getData(datasets, sel = [], fetch = window.fetch) {
  if (sel.length > 0 && !sel[0].newFormat) {
    throw new Error("OLD FORMAT!");
  }

  let {selString, lastCode} = getSelString(sel);
  let retval = {data: {}};

  let barChartData;
  if (sel.length === 0) {
    let url = `${endpoint}${sel.length}var_percent/${selString}.json`
    let response = await fetch(url);
    barChartData = await response.json();
    retval.total_pop = {count: barChartData.sex.count[0] + barChartData.sex.count[1], percent: 100};
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
      retval.data[dataset.key][table.code] = {values: barChartData[table.code]};
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

export function makeDataNew(group, dataset, data) {
  let valsAll = data.all[group][dataset].values;
  let valsSelected = data.selected[group][dataset].values;

  let arr = [];

  codes[dataset].forEach((cd, i) => {
    let label = cd.label;
    let valAll = valsAll.percent[i];
    let valSelected = valsSelected.percent[i];
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