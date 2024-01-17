<script>
  export let data;
  export let xKey = "value";
  export let yKey = "category";
  export let zKey = "areanm";

  // if less than 1% use decimal formatting
  export let formatTick = (num) => num.toFixed(1);
  export let suffix = "%";
  export let base = null;
  export let barHeight = 25;
  export let markerWidth = 3;
  export let showLegend = true;

  function groupData(data, key) {
    let data_indexed = {};
    let keys = [];
    for (const d of data) {
      if (!data_indexed[d[key]]) {
        data_indexed[d[key]] = {
          label: d[key],
          values: [],
        };
        keys.push(d[key]);
      }
      data_indexed[d[key]].values.push(d);
    }

    let data_grouped = [];
    keys.forEach((key) => {
      data_grouped.push(data_indexed[key]);
    });

    return data_grouped;
  }

  $: xMax = Math.max(...data.map((d) => d[xKey]));
  $: zDomain = data.map((d) => d[zKey]).filter((v, i, a) => a.indexOf(v) === i);

  $: xScale = (value) => (value / xMax) * 100;
  $: data_grouped = groupData(data, yKey);
</script>

<table class="visuallyhidden">
  <thead>
    <tr>
      <th>Category</th><th>Proportion of selected group</th><th
        >Proportion of whole population</th
      >
    </tr>
  </thead>
  <tbody>
    {#each data_grouped as group}
      <tr>
        <td>{group.label}</td>
        {#each group.values as d, i}
          <td>{formatTick(d[xKey])}{suffix}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<div aria-hidden="true">
  {#if showLegend && zDomain[1]}
    <ul class="legend-block">
      {#each zDomain as group, i}
        <li class:ew={i != 0}>
          <div
            class="legend-vis {i == 0 ? 'bar' : 'marker'}"
            style:height="1rem"
            style:width={i == 0 ? "1rem" : markerWidth + "px"}
          />
          <span class={i == 0 ? "bold" : "brackets"}>{group}</span>
        </li>
      {/each}
    </ul>
  {/if}

  {#each data_grouped as group}
    <div class="label-group">
      {#if group.label === "Can speak English very well"}
        <p class="label-subhead">Main language is not English (English or Welsh in Wales) and:</p>
      {/if}
      {group.label}
      <span class="nowrap">
        {#each group.values as d, i}
          <span class="label {i == 0 ? 'bold' : 'sml brackets'}"
            >{formatTick(d[xKey])}{suffix}</span
          >
        {/each}
      </span>
    </div>
    <div class="bar-group" style:height="{barHeight}px">
      {#each group.values as d, i}
        {#if i == 0}
          <div class="bar" style:left="0" style:width="{xScale(d[xKey])}%" />
        {:else}
          <div
            class="marker"
            style:left="calc({xScale(d[xKey])}% - {markerWidth / 2}px)"
            style:border-left-width="{markerWidth}px"
          />
        {/if}
      {/each}
    </div>
  {/each}
</div>

{#if base}
  <small>{base}</small>
{/if}

<style>
  .label-group {
    margin: 4px 0 1px 0;
    padding: 0;
    line-height: 1.2;
    font-size: 14px;
  }
  .bold {
    font-weight: bold;
    color: #1b708f;
  }
  .sml {
    margin-left: 3px;
    font-size: 14px;
  }
  .brackets::before {
    content: "(";
  }
  .brackets::after {
    content: ")";
  }
  .bar-group {
    display: block;
    position: relative;
    width: 100%;
  }
  .bar-group > div {
    position: absolute;
    height: 100%;
    top: 0;
  }
  .bar {
    background-color: #27a0cc !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .marker {
    border-left-color: black;
    border-left-style: solid;
  }
  ul.legend-block {
    list-style-type: none;
    padding: 0;
    margin: 0 0 5px 0;
  }
  ul.legend-block > li {
    display: inline-block;
    margin: 0 10px 0 0;
    padding: 0;
  }
  .legend-vis {
    display: inline-block;
    transform: translate(0, 3px);
  }
  small {
    font-size: 14px;
    line-height: 1.3;
    display: block;
    margin-top: 8px;
    color: #777;
  }
  .nowrap {
    white-space: nowrap;
  }
  .label-subhead {
    line-height: 1.2;
    font-size: 14px;
    margin: 6px 0;
  }
</style>
