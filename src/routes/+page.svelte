<script>
  import MapTiles from "../lib/ui/tiles/MapTiles.svelte";

  import BarChartCard from "../lib/ui/tiles/BarChartCard.svelte";

  import PopulationTile from "../lib/ui/tiles/PopulationTile.svelte";
  import AgeProfileTile from "../lib/ui/tiles/AgeProfileTile.svelte";

  // import StandaloneLegend from "$lib/chart/StandaloneLegend.svelte";
  import SimpleLegend from "$lib/chart/SimpleLegend.svelte";

  import { page } from "$app/stores";
  import { goto, afterNavigate } from "$app/navigation";
  import { base } from "$app/paths";
  import { onMount, setContext } from "svelte";
  import { ckmeans } from "simple-statistics";
  import {
    getColor,
    capitalise,
    removeCategoryCountFromName,
    getData,
  } from "$lib/utils";
  import {
    themes,
    vars,
    varsNested,
    mapStyle,
    mapBounds,
    datasets,
    unblockedCombinationCounts,
    ladBounds,
    colors,
  } from "$lib/config";
  import {
    Breadcrumb,
    Titleblock,
    Card,
    Cards,
    Twisty,
    Notice,
    Button,
  } from "@onsvisual/svelte-components";
  import BarChart from "$lib/chart/BarChart.svelte";
  import GroupChart from "$lib/chart/GroupChart.svelte";
  import Content from "$lib/layout/Content.svelte";
  import OptionPicker from "$lib/ui/OptionPicker.svelte";

  export let data;

  // STYLE CONFIG
  // Set theme globally (options are 'light' or 'dark')
  let theme = "light";
  setContext("theme", themes[theme]);

  let chartTypeOptions = [
    { name: "Comparison marker", component: BarChart },
    { name: "Grouped bar", component: GroupChart },
  ];

  // State
  let selected = [];
  let selectOpen = true;
  //let hovered = null;
  let status = "success"; // Options: success, fail, loading
  let u16 = false; // If age selection is 0-15 some tables won't show data
  let varcount = 0; // Number of variables successfully loaded
  let chart_type = BarChart;

  const getUnblockedCount = (op) =>
    unblockedCombinationCounts[
      [...selected.map((d) => d.key), op.key]
        .sort((a, b) => a.localeCompare(b))
        .join(",")
    ];

  function updateUrl() {
    // TODO: check what `goto` does
    goto(`${base}?${selected.map((d) => `${d.key}=${d.code}`).join("&")}`, {
      noScroll: true,
    });
  }

  function doSelect(variable, cat) {
    selected = [
      ...selected.filter((d) => d.topic !== variable.shortLabel),
      { topic: variable.shortLabel, key: variable.key, ...cat },
    ];
    updateUrl();
  }

  function doDeselect(variable) {
    selected = selected.filter((d) => d.topic !== variable.shortLabel);
    updateUrl();
  }

  function unSelect(topic) {
    selected = selected.filter((d) => d.topic != topic);
    updateUrl();
  }

  function groupsToBreaks(groups) {
    let breaks = [];
    groups.forEach((g) => breaks.push(g[0]));
    const endOfLastGroup = groups.flat().pop();
    if (groups.length === 1 || endOfLastGroup != breaks[breaks.length - 1])
      breaks.push(endOfLastGroup);
    return breaks;
  }

  function processData(d) {
    data.selected = d.data;
    data.selected.total_pop = d.total_pop;

    data.geoPerc = [];
    let groups = null;

    if (true) {
      // FIXME: check this against Ahmad's previous version,
      //     and probably create 100% data in Python for no selections.
      data.geoCodesAndNames.forEach(({ code, name }) => {
        let value =
          selected.length === 0
            ? 100
            : d.mapData[code] != null
            ? d.mapData[code][1]
            : null;
        data.geoPerc.push({ code: code, name, value });
      });

      let vals = data.geoPerc.map((d) => d.value).filter((d) => d != null);
      groups =
        vals.length === 0 ? null : ckmeans(vals, Math.min(5, vals.length));
    } else {
      data.geoCodesAndNames.forEach(({ code, name }) => {
        data.geoPerc.push({ code, name, value: null });
      });
    }

    if (groups == null) {
      data.geoPerc.forEach((d) => (d.color = colors.nodata));
      data.geoBreaks = [0, 100];
    } else if (selected.length === 0) {
      data.geoPerc.forEach((d) => (d.color = colors.seq[4]));
      data.geoBreaks = [100, 100];
    } else {
      let breaks = groupsToBreaks(groups);
      data.geoPerc.forEach(
        (d) =>
          (d.color =
            d.value != null
              ? getColor(d.value, breaks, colors.seq)
              : colors.nodata)
      );
      data.geoBreaks = breaks;
    }

    varcount = selected.length;
    status = "success";
  }

  function loadData() {
    status = "loading";
    u16 =
      selected &&
      selected.some((d) =>
        [
          "Aged 4 years and under",
          "Aged 5 to 9 years",
          "Aged 10 to 14 years",
          "Aged 15 years and under",
        ].includes(d.label)
      );
    getData(datasets, selected).then(processData);
  }

  function refreshData() {
    selected = [];
    for (let pair of $page.url.searchParams.entries()) {
      let variable = vars.find((d) => d.key == pair[0]);
      if (!variable) continue;
      let category = variable.cats.find((d) => d.code == pair[1]);
      if (!category) continue;
      selected.push({
        topic: variable.shortLabel,
        key: variable.key,
        ...category,
      });
    }
    loadData();
  }

  function trimLabel(label) {
    return label.split(": ").slice(-1)[0];
  }

  afterNavigate(refreshData); // Refresh data when user navigates
  $: console.log("selected", selected);
</script>

<svelte:head>
  <title>Create a population group profile</title>
  <meta name="description" content="" />
  <meta property="og:title" content="Create a population group profile" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={base} />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:description" content="" />
  <meta name="description" content="" />
</svelte:head>

<Breadcrumb
  links={[
    { label: "Census", href: "/census" },
    { label: "Create a population group profile" },
  ]}
/>
<Titleblock title="Create a population group profile">
  <div slot="after">
    <p class="subtitle">
      Select one or more identity characteristics to define a population group, for example
      <a href="?religion_tb=7&country_of_birth_3a=1">Sikhs born in the UK</a>
      or
      <a href="?resident_age_3a=3&country_of_birth_8a=2">people aged 65+ born in Ireland</a>.
      Once selected, you will see how this group compares to the whole population of England and Wales based on Census 2021 data.
    </p>

    <Twisty title="Select characteristics" open={selectOpen}>
      <OptionPicker
        options={varsNested}
        clickCallback={doSelect}
        removeCatCallback={doDeselect}
        globalSelectedCategories={selected}
        disabled={status === "loading"}
      />
      <Button variant="secondary" small on:click={(e) => e.detail.target.parentElement.parentElement.removeAttribute('open')}>Close menu</Button>
    </Twisty>

    {#if selected[0]}
      <Notice mode="{status == "failed" || u16 == true ? 'pending' : 'info'}">
        <p>
          {#if selected.length === 1}
            The profile below is for people with the following characteristic:
          {:else}
            The profile below is for people with {#if selected.length === 2}both{:else}all{/if}
            of the following characteristics:
          {/if}
        </p>
        {#each selected as item, i}
          {#if status == "loading"}
            <div class="chip chip-pending">
              <span class="chip-text">{capitalise(item.topic)}: {capitalise(trimLabel(item.label))}</span>
              <div class="chip-loader" />
            </div>
          {:else}
            <button class="chip" on:click={() => unSelect(item.topic)}>
              <span class="chip-text">{capitalise(item.topic)}: {capitalise(trimLabel(item.label))}</span>
              <span class="chip-ready" />
            </button>
          {/if}
        {/each}
        {#if status == "failed" || u16 == true}
          <p style:margin="1rem 0 0">
            Some datasets not available for selected variables.
            {#if status == "failed"}
              Try removing a variable to see more datasets.
            {/if}
            {#if u16 == true}
              Economic indicators (employment, social status etc) not available for
              ages 0 to 15.
            {/if}
          </p>
        {/if}
      </Notice>
    {/if}
  </div>
</Titleblock>

{#if status == "success" && selected.length > 0}
  <!-- <Notice>
    {#if selected.length === 1}
      The profile below is for people with the following characteristic:
    {:else}
      The profile below is for people with all of the following characteristics:
    {/if}
    <ul>
      {#each (console.log(selected), selected) as s}
        <li><strong>{s.topic}:</strong> {s.label}</li>
      {/each}
    </ul>
  </Notice> -->
  <Cards title="Demographics" height="auto">
    <Card colspan={3} noBackground>
      <SimpleLegend/>
    </Card>
    <PopulationTile {data} />
    <AgeProfileTile {data} {selected} />
    {#if !selected.map(d => d.key).includes("sex")}
    <BarChartCard
      title="Sex"
      table={{code: "sex", key: "Sex"}}
      {data}
      {chart_type}/>
    {/if}
  </Cards>

  <MapTiles {data} {mapStyle} {mapBounds} {ladBounds} {selected} {colors} />
  <!-- <span slot="meta" style:margin-left="10px"> -->
  <!-- <span>
    <strong>Chart type:</strong>
    {#each chartTypeOptions as chartTypeOption}
      <label
        ><input
          type="radio"
          bind:group={chart_type}
          name="chart-type"
          value={chartTypeOption.component}
        />{chartTypeOption.name}</label
      >
    {/each}
  </span> -->

  {#each datasets[0].tablesCategorised as category}
    <Cards title={category.categoryName} height="auto">
      <Card colspan={3} noBackground>
        <SimpleLegend>{category.categoryDescription}</SimpleLegend>
        <!-- <StandaloneLegend {selected} /> -->
      </Card>
      {#each category.tables.filter((t) => data.selected.residents[t.code].values !== "blocked" && data.selected.residents[t.code].values !== undefined) as table}
        <BarChartCard
          title={removeCategoryCountFromName(table.key)}
          {table}
          {data}
          {chart_type}
        />
      {/each}
    </Cards>
  {/each}
{/if}

<style>
  :global(.tile) {
    color: black;
    font-size: 1rem;
  }
  :global(p) {
    font-size: 1rem;
  }
  :global(.mapboxgl-ctrl-icon) {
    visibility: visible !important;
  }
  a {
    color: #206095;
    text-decoration: underline;
  }
  a:hover {
    color: rgb(0, 60, 87);
  }
  .subtitle {
    margin: 0 0 24px;
  }
  .btn {
    padding: 2px 4px;
    margin: 0;
    border: 2px solid #206095;
    cursor: pointer;
    color: #206095;
    background-color: lightgrey;
  }
  button {
    cursor: pointer;
  }
  .btn {
    color: white;
    background: #0f8243;
    font-weight: bold;
    border: 0;
    border-radius: 3px;
    box-shadow: 0 3px #193c23;
    padding: 7px 20px;
    transform: translate(0, -1.5px);
  }
  .btn:hover {
    background-color: #30693c;
  }
  .btn:active {
    box-shadow: none;
    transform: translate(0, 1.5px);
  }
  .warning {
    background-color: #fef4ee;
    border: none;
    border-left: 5px solid #ff803b;
    padding: 10px;
    font-size: 0.9rem;
    margin-bottom: 5px;
  }
  .num-desc {
    display: block;
    margin-top: 10px;
    color: #707070;
    font-size: 14px;
    line-height: 1.3;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    background-color: rgb(231, 243, 236);
    font-size: 0.9rem;
    border: 1.5px solid #0f8243;
    border-radius: 3px;
    padding: 5px;
    margin: 0 5px 5px 0;
    line-height: normal;
  }
  .chip-pending {
    background-color: #fef4ee;
    border-color: #ff803b;
  }
  .chip-text {
    font-size: 16px !important;
    padding: 0 8px 0 4px;
  }
  .chip-ready {
    display: block;
    box-sizing: border-box;
    background: #0f8243
      url("https://bothness.github.io/geo-draw/img/x-close.svg") no-repeat
      center;
    margin: 0;
    width: 20px;
    height: 20px;
    min-width: 20px;
    min-height: 20px;
    border: none;
    border-radius: 50%;
  }
  .chip-loader {
    display: block;
    box-sizing: border-box;
    margin: 0;
    border: 5px solid rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    border-top: 5px solid #ff803b;
    border-right: 5px solid #ff803b;
    width: 20px;
    height: 20px;
    min-width: 20px;
    min-height: 20px;
    -webkit-animation: spin 2s linear infinite; /* Safari */
    animation: spin 0.75s linear infinite;
  }
  /* Safari */
  @-webkit-keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
    }
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
