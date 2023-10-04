<script>
  import { page } from "$app/stores";
  import { goto, afterNavigate } from "$app/navigation";
  import { base } from "$app/paths";
  import { setContext } from "svelte";
  import { ckmeans } from "simple-statistics";
  import {
    getColor,
    capitalise,
    removeCategoryCountFromName,
    getData,
    trimLabel,
  } from "$lib/utils";
  import {
    themes,
    vars,
    codes,
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
    Container,
    Card,
    Cards,
    Twisty,
    Notice,
    Button,
  } from "@onsvisual/svelte-components";
  import BarChart from "$lib/chart/BarChart.svelte";
  import GroupChart from "$lib/chart/GroupChart.svelte";
  import OptionPicker from "$lib/ui/OptionPicker.svelte";
  import MapTiles from "../lib/ui/tiles/MapTiles.svelte";
  import BarChartCard from "../lib/ui/tiles/BarChartCard.svelte";
  import PopulationTile from "../lib/ui/tiles/PopulationTile.svelte";
  import AgeProfileTile from "../lib/ui/tiles/AgeProfileTile.svelte";
  import SimpleLegend from "$lib/chart/SimpleLegend.svelte";

  import Handlebars from "handlebars";
  import JSZip from "jszip";
  import accessibleSpreadsheetCreator from "accessible-spreadsheet-creator";

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
      keepFocus: true,
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

  function chartIsAvailable(tableCode, data) {
    const values = data.selected.residents[tableCode].values;
    return values !== "blocked" && values !== undefined;
  }

  function getAvailableChartCounts(data) {
    let available = 0,
      missing = 0;

    for (const category of datasets[0].tablesCategorised) {
      for (const t of category.tables) {
        if (chartIsAvailable(t.code, data)) {
          ++available;
        } else {
          console.log(t.code);
          ++missing;
        }
      }
    }

    return { available, missing };
  }

  // {#each datasets[0].tablesCategorised as category}
  //   {#if category.tables.some((t) => chartIsAvailable(t.code))}
  //     <Cards title={category.categoryName} height="auto">
  //       <Card colspan={3} noBackground>
  //         <SimpleLegend>{category.categoryDescription}</SimpleLegend>
  //       </Card>
  //       {#each category.tables.filter((t) => chartIsAvailable(t.code)) as table}

  function downloadData(data) {
    const odsData = {
      selectedCharacteristics: [
        {
          variable: "Placeholder variable 1",
          category: "Placeholder category 1",
        },
        {
          variable: "Placeholder variable 2",
          category: "Placeholder category 2",
        },
      ],
      tableHeadings: ["Category", "Selected group", "England and Wales"],
      sheets: [],
    };
    for (let table of datasets[0].tables) {
      if (table.code === "resident_age_23a") continue;
      if (data.selected.residents[table.code].values == null) continue;
      let sheet = {
        sheetName: table.key,
        tableName: table.code,
        rowData: codes[table.code].map((d, i) => ({
          name: d.label,
          values: [
            data.selected.residents[table.code].values.percent[i],
            data.all.residents[table.code].values.percent[i],
          ],
        })),
      };
      odsData.sheets.push(sheet);
    }
    console.log({ data, vars, datasets, codes, odsData });

    let zipFiles = accessibleSpreadsheetCreator(odsData, Handlebars);
    const z = new JSZip();
    for (let { filename, contents } of zipFiles) {
      z.file(filename, contents);
    }
    z.generateAsync({ type: "blob", compression: "DEFLATE" }).then((d) => {
      let blob = new Blob([d], {
        type: "application/vnd.oasis.opendocument.spreadsheet",
      });
      let url = URL.createObjectURL(blob);

      // The method of creating a anchor tag and clicking it is from https://stackoverflow.com/a/18197341
      var element = document.createElement("a");
      element.setAttribute("href", url);
      element.setAttribute("download", "data-download.ods");

      element.style.display = "none";
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    });
  }

  function processData(d) {
    data.selected = d.data;
    data.selected.total_pop = d.total_pop;

    data.geoPerc = [];
    let groups;

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
    groups = vals.length === 0 ? null : ckmeans(vals, Math.min(5, vals.length));

    if (!groups) {
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
      Select one or more identity characteristics to define a population group,
      for example
      <a href="?religion_tb=7&country_of_birth_3a=1">Sikhs born in the UK</a>
      or
      <a href="?resident_age_3a=3&country_of_birth_8a=2"
        >people aged 65+ born in Ireland</a
      >. Once selected, you will see how this group compares to the whole
      population of England and Wales based on Census 2021 data.
    </p>

    <Twisty title="Select characteristics" open={selectOpen}>
      <OptionPicker
        options={varsNested}
        clickCallback={doSelect}
        removeCatCallback={doDeselect}
        globalSelectedCategories={selected}
        disabled={status === "loading"}
      />
      <Button
        variant="secondary"
        small
        on:click={(e) =>
          e.detail.target.parentElement.parentElement.removeAttribute("open")}
        >Close menu</Button
      >
    </Twisty>

    {#if selected[0]}
      <Notice mode={status == "failed" || u16 == true ? "pending" : "info"}>
        <div aria-live="polite">
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
                <span class="chip-text"
                  >{capitalise(item.topic)}: {capitalise(
                    trimLabel(item.label)
                  )}</span
                >
                <div class="chip-loader" />
              </div>
            {:else}
              <button class="chip" on:click={() => unSelect(item.topic)}>
                <span class="chip-text"
                  >{capitalise(item.topic)}: {capitalise(
                    trimLabel(item.label)
                  )}</span
                >
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
                Economic indicators (employment, social status etc) not
                available for ages 0 to 15.
              {/if}
            </p>
          {/if}
        </div>
      </Notice>
      {#if getAvailableChartCounts(data).missing > 0}
        <Notice mode={"info"}>
          <strong>
            {getAvailableChartCounts(data).available}
            of {getAvailableChartCounts(data).missing +
              getAvailableChartCounts(data).available} charts available.
          </strong><br/>
          <!-- TODO: distinguish between tables missing because same as input selection and disclosive ones -->
          <a
            href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/methodologies/protectingpersonaldataincensus2021results"
            >Protecting personal data</a
          >
          prevents some datasets from being included.
        </Notice>
      {/if}
    {/if}
  </div>
</Titleblock>

{#if status == "success" && selected.length > 0}
  <Container cls="show-overflow" width="wide">
    <div class="action-buttons">
      <Button on:click={() => downloadData(data)} variant="secondary" icon="download" small>Download profile</Button>
      <Button on:click={() => print()} variant="secondary" icon="print" small>Print profile</Button>
    </div>
  </Container>

  <Cards title="Demographics" height="auto">
    <Card colspan={3} noBackground>
      <SimpleLegend
        >Number of people, age and sex compared to the population as a whole.</SimpleLegend
      >
    </Card>
    <PopulationTile {data} />
    <AgeProfileTile {data} {selected} />
    {#if !selected.map((d) => d.key).includes("sex")}
      <BarChartCard
        title="Sex"
        table={{ code: "sex", key: "Sex" }}
        {data}
        {chart_type}
      />
    {/if}
  </Cards>

  <MapTiles {data} {mapStyle} {mapBounds} {ladBounds} {selected} {colors} />

  {#each datasets[0].tablesCategorised as category}
    {#if category.tables.some((t) => chartIsAvailable(t.code, data))}
      <Cards title={category.categoryName} height="auto">
        <Card colspan={3} noBackground>
          <SimpleLegend>{category.categoryDescription}</SimpleLegend>
        </Card>
        {#each category.tables.filter( (t) => chartIsAvailable(t.code, data) ) as table}
          <BarChartCard
            title={removeCategoryCountFromName(table.key)}
            {table}
            {data}
            {chart_type}
          />
        {/each}
      </Cards>
    {/if}
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
  button {
    cursor: pointer;
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
  button.chip:focus {
    outline: 3px solid var(--ons-color-sun-yellow, #fbc900);
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
  .action-buttons {
    text-align: right;
    margin-top: -20px;
    padding-bottom: 3px;
  }
  :global(.ons-panel) {
    margin-bottom: 0 !important;
  }
</style>
