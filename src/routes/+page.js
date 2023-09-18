import { getTopo, getData } from "$lib/utils";
import { ladBounds, datasets, colors } from "$lib/config";
import { base } from "$app/paths";

export async function load({ fetch }) {
  let geojson = await getTopo(base + ladBounds.url, ladBounds.layer, fetch);

  let all = (await getData(datasets, [], fetch)).data;

  let geoCodesAndNames = geojson.features.map((d) => ({
    code: d.properties[ladBounds.code],
    name: d.properties[ladBounds.name],
  }));

  let geoPerc = geoCodesAndNames.map(({ code, name }) => ({
    code,
    name,
    value: 100,
    color: colors.seq[4],
  }));

  return { geojson, geoCodesAndNames, geoPerc, all, selected: null };
}
