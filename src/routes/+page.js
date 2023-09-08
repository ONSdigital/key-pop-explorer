import { getTopo, getData, makeSum } from "$lib/utils";
import { ladBounds, datasets, colors } from "$lib/config";
import { base } from "$app/paths";

export async function load({ fetch }) {
  let geojson = await getTopo(base + ladBounds.url, ladBounds.layer, fetch);

  let all = (await getData(datasets, [], fetch)).data;
  all.total_pop = makeSum(all.residents.sex.values.count);

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

  return { geojson, geoCodesAndNames, geoPerc, all, selected: all, geoBreaks: [0, 100] };
}
