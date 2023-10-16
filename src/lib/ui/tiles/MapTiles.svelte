<script>
  import { Card, Cards } from "@onsvisual/svelte-components";
  import { Map, MapSource, MapLayer, MapTooltip } from "@onsvisual/svelte-maps";
  import BreaksChart from "$lib/chart/BreaksChart.svelte";
  import Table from "$lib/chart/Table.svelte";
  import NoData from "$lib/chart/NoData.svelte";

  export let data;
  export let mapStyle;
  export let ladBounds;
  export let mapBounds;
  export let selected;
  export let colors;

  let hovered;

  $: lookup = ((data) => {
    const lkp = {};
    console.log("data", data);
    if (Array.isArray(data)) data.forEach((d) => (lkp[d.code] = d));
    return lkp;
  })(data.geoPerc);

  const makeLabel = (code) => {
    let label = "";
    if (code) {
      label = `<b>${data.geoCodesLookup[hovered].name}</b><br/>`;
      const value = lookup?.[code]?.value;
      label += value != null ? `${value}%` : "No data";
    }
    return label;
  };
</script>

<Cards title="Population by area" height="auto" cls="pgp-map-tiles">
  <Card colspan={3} rowspan={1} noBackground>
    <p class="subtitle">
      People with the selected characteristics as a proportion of whole
      population.
    </p>
  </Card>
  <Card colspan={2} rowspan={2} noBackground>
    <div style:height="450px">
      <Map
        style={mapStyle}
        location={{ bounds: mapBounds }}
        options={{ preserveDrawingBuffer: true }}
      >
        {#if data.geojson && data.geoPerc}
          <MapSource
            id="lad"
            type="geojson"
            data={data.geojson}
            promoteId={ladBounds.code}
          >
            <MapLayer
              id="lad-fill"
              data={data.geoPerc}
              idKey="code"
              nameKey="name"
              valueKey="value"
              hover={true}
              bind:hovered
              tooltip={true}
              type="fill"
              paint={{
                "fill-color": [
                  "case",
                  ["!=", ["feature-state", "color"], null],
                  ["feature-state", "color"],
                  "rgba(255, 255, 255, 0)",
                ],
                "fill-opacity": 0.8,
              }}
              order="place_other"
            >
              <MapTooltip content={makeLabel(hovered)} />
            </MapLayer>
            <MapLayer
              id="lad-line"
              type="line"
              paint={{
                "line-color": "white",
                "line-width": 0.3,
              }}
              order="place_other"
            />
            <MapLayer
              id="lad-hover"
              type="line"
              paint={{
                "line-color": "black",
                "line-width": 2,
                "line-opacity": [
                  "case",
                  ["==", ["feature-state", "hovered"], true],
                  1,
                  0,
                ],
              }}
              order="place_other"
            />
          </MapSource>
        {/if}
      </Map>
    </div>
    {#if data.geoBreaks && data.geoPerc}
      <div class="map-legend">
        <div class="map-legend-breaks">
          <BreaksChart
            breaks={data.geoBreaks}
            hovered={hovered && data.geoPerc.find((d) => d.code == hovered)
              ? data.geoPerc.find((d) => d.code == hovered).value
              : null}
            colors={data.geoBreaks[1] == 100 ? [colors.seq[4]] : colors.seq}
          />
        </div>
        <div class="map-legend-nodata">
          <NoData />
        </div>
      </div>
    {/if}
  </Card>
  <Card title="Areas with high %">
    {#if data.geoPerc && selected[0]}
      <Table
        data={[...data.geoPerc]
          .filter((d) => d.value != null)
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)}
      />
    {:else}
      <span class="muted">Make a selection to see rankings.</span>
    {/if}
  </Card>
  <Card title="Areas with low %">
    {#if data.geoPerc && selected[0]}
      <Table
        data={data.geoPerc
          .filter((d) => d.value != null)
          .sort((a, b) => b.value - a.value)
          .slice(-5)}
        offset={data.geoPerc.filter((d) => d.value != null).length - 4}
      />
    {:else}
      <span class="muted">Make a selection to see rankings.</span>
    {/if}
  </Card>
</Cards>

<style>
  .muted {
    color: grey;
  }
  .subtitle {
    /* TODO avoid duplication with index.svelte */
    font-size: 16px;
    margin: -10px 0 0;
  }
  .map-legend {
    width: 100%;
    height: 70px;
    display: flex;
    flex-direction: row;
  }
  .map-legend > div {
    height: 100%;
  }
  .map-legend > .map-legend-breaks {
    flex-grow: 1;
    overflow: visible;
  }
  .map-legend > .map-legend-nodata {
    width: 80px;
    min-width: 80px;
    flex-grow: 0;
    padding-left: 8px;
    overflow: visible;
  }
</style>
