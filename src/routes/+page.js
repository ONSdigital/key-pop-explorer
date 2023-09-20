import { getTopo, getData } from "$lib/utils";
import { ladBounds, datasets, colors } from "$lib/config";
import { base } from "$app/paths";

export async function load({ fetch }) {
  let geojson = await getTopo(base + ladBounds.url, ladBounds.layer, fetch);

  let all = (await getData(datasets, [], fetch)).data;
  
  let geoCodesAndNames = [];
  let geoCodesLookup = {}
  let geoPerc = [];

  geojson.features.forEach((d) => {
    const code = d.properties[ladBounds.code];
    const name = d.properties[ladBounds.name];
    const obj = {code, name};
    geoCodesAndNames.push(obj);
    geoCodesLookup[code] = obj;
    geoPerc.push({
      ...obj,
      value: 100,
      color: colors.seq[4],
    });
  });

  return { geojson, geoCodesAndNames, geoCodesLookup, geoPerc, all, selected: null };
}
