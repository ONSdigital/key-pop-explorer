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
    createOdsZipFiles,
    chartIsAvailable,
    getAvailableChartCounts,
    getStatusOfVariables,
  } from "$lib/utils";
  import {
    themes,
    vars,
    varsNested,
    mapStyle,
    mapBounds,
    maxBounds,
    datasets,
    ladBounds,
    colors,
  } from "$lib/config";
  import {
    Breadcrumb,
    Titleblock,
    Container,
    Card,
    Cards,
    Notice,
    Button,
    analyticsEvent,
    Section,
    ShareButtons,
    Divider,
  } from "@onsvisual/svelte-components";
  import BarChart from "$lib/chart/BarChart.svelte";
  import GroupChart from "$lib/chart/GroupChart.svelte";
  import OptionPicker from "$lib/ui/OptionPicker.svelte";
  import MapTiles from "../lib/ui/tiles/MapTiles.svelte";
  import BarChartCard from "../lib/ui/tiles/BarChartCard.svelte";
  import PopulationTile from "../lib/ui/tiles/PopulationTile.svelte";
  import AgeProfileTile from "../lib/ui/tiles/AgeProfileTile.svelte";
  import SimpleLegend from "$lib/chart/SimpleLegend.svelte";
  import Twisty from "$lib/ui/Twisty.svelte";
  import Caveat from "$lib/ui/Caveat.svelte";

  import JSZip from "jszip";

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
  let selectOpen = false;
  //let hovered = null;
  let status = "success"; // Options: success, fail, loading
  let u16 = false; // If age selection is 0-15 some tables won't show data
  let varcount = 0; // Number of variables successfully loaded
  let chart_type = BarChart;
  let activeColumn = null;

  function updateUrl(newSelected) {
    goto(`${base}?${newSelected.map((d) => `${d.key}=${d.code}`).join("&")}`, {
      noScroll: true,
      keepFocus: true,
    });
  }

  function doSelect(variable, cat) {
    const newSelected = [
      ...selected.filter((d) => d.topic !== variable.shortLabel),
      {
        topic: variable.shortLabel,
        longLabel: variable.label,
        key: variable.key,
        ...cat,
      },
    ];
    analyticsEvent({
      event: "variableSelect",
      variable: variable.shortLabel,
      category: cat.label,
      count: newSelected.length,
    });
    updateUrl(newSelected);
  }

  function unSelect(topic) {
    const newSelected = selected.filter((d) => d.topic !== topic);
    updateUrl(newSelected);
  }

  function groupsToBreaks(groups) {
    let breaks = [];
    groups.forEach((g) => breaks.push(g[0]));
    const endOfLastGroup = groups.flat().pop();
    if (groups.length === 1 || endOfLastGroup != breaks[breaks.length - 1])
      breaks.push(endOfLastGroup);
    return breaks;
  }

  function downloadData(data) {
    analyticsEvent({
      event: "fileDownload",
      fileExtension: "ods",
      selection: selected.map((s) => `${s.topic}: ${s.label}`),
    });
    let zipFiles = createOdsZipFiles(data, datasets, selected);

    const z = new JSZip();
    for (let { filename, contents } of zipFiles) {
      z.file(filename, contents, {
        compression: filename === "mimetype" ? "STORE" : "DEFLATE",
      });
    }
    z.generateAsync({ type: "blob" }).then((d) => {
      let blob = new Blob([d], {
        type: "application/vnd.oasis.opendocument.spreadsheet",
      });
      let urlClass = window.URL || window.webkitURL || window;
      let url = urlClass.createObjectURL(blob);

      // The method of creating a anchor tag and clicking it is from https://stackoverflow.com/a/18197341
      let a = document.createElement("a");
      a.download =
        "population-profile-" +
        selected.map((d) => `${d.key}-${d.code}`).join("-") +
        ".ods";
      a.href = url;
      a.style.display = "none";

      document.body.appendChild(a);

      a.click();

      document.body.removeChild(a);
      // URL.revokeObjectURL(url);
    });
  }

  function printPage() {
    analyticsEvent({
      event: "pagePrint",
      selection: selected.map((s) => `${s.topic}: ${s.label}`),
    });
    print();
  }

  function processData(d) {
    data.selected = d.data;
    data.selected.total_pop = d.total_pop;

    data.geoPerc = [];
    let groups;

    data.geoCodesAndNames.forEach(({ code, name }) => {
      let value =
        selected.length === 0
          ? 100
          : d.mapData[code] != null
          ? d.mapData[code][1]
          : null;
      let count =
        selected.length === 0
          ? -1
          : d.mapData[code] != null
          ? d.mapData[code][0]
          : null;
      data.geoPerc.push({ code: code, name, value, count });
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

    data.statusOfVariables = getStatusOfVariables(
      data.selected,
      datasets[0].tables
    );
    data.availableChartCounts = getAvailableChartCounts(data.statusOfVariables);

    status = data.selected.total_pop.count == null ? "failed" : "success";
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
        longLabel: variable.label,
        key: variable.key,
        ...category,
      });
    }
    loadData();
  }

  function totalPopIsAtLeast100(data) {
    return (
      data.selected.total_pop.count != null &&
      data.selected.total_pop.count >= 100
    );
  }

  function shouldShowMissingDataNotice(data) {
    return (
      data.selected != null &&
      data.availableChartCounts.missing > 0 &&
      totalPopIsAtLeast100(data)
    );
  }

  // Refresh data and reset option picker state when user navigates
  afterNavigate(() => {
    refreshData();
    selectOpen = false;
    activeColumn = null;
  });
</script>

<svelte:head>
  <title>Create a population group profile - Census 2021 - ONS</title>
  <meta
    property="og:title"
    content="Create a population group profile - Census 2021"
  />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://www.ons.gov.uk{base}/img/og.png" />
  <meta property="og:image:type" content="image/png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta
    property="og:description"
    content="Select multiple datasets to define a population group based on Census 2021 England and Wales data."
  />
  <meta
    name="description"
    content="Select multiple datasets to define a population group based on Census 2021 England and Wales data."
  />
  <meta property="og:url" content="https://www.ons.gov.uk{base}" />
  <link rel="canonical" href="https://www.ons.gov.uk{base}" />
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
      for example people whose
      <a href="?main_language_23a=6" data-sveltekit-noscroll
        >main language is Spanish</a
      >
      or people
      <a href="?disability_3a=1&country_of_birth_3a=1" data-sveltekit-noscroll
        >born in the UK who are disabled under the Equality Act</a
      >. Once selected, you will see how your selected group compares to the
      whole population of England and Wales, based on Census 2021 data.
    </p>

    {#if selected[0]}
      <Notice mode={status == "failed" ? "error" : "info"}>
        <div aria-live="polite">
          {#if status != "failed"}
            <p>
              {#if selected.length === 1}
                The profile below is for people who share the following
                characteristic:
              {:else}
                The profile below is for people who share {#if selected.length === 2}both{:else}all{/if}
                of the following characteristics:
              {/if}
            </p>
          {/if}
          {#each selected as item}
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
          {#if status == "failed"}
            <p style:margin="1rem 0 0">
              No data is available for the selected variables. Try removing a
              variable to see more datasets.
            </p>
          {/if}
        </div>
      </Notice>
      {#if shouldShowMissingDataNotice(data)}
        <Notice mode={"info"}>
          <strong>
            {data.availableChartCounts.available}
            of {data.availableChartCounts.total} charts are available.
          </strong>
          {#if data.availableChartCounts.missingBecauseDisclosive > 0}
            <br />
            <a
              href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/methodologies/protectingpersonaldataincensus2021results"
              >Protecting personal data</a
            >
            prevents some datasets from being included.
          {/if}
          {#if u16 && data.availableChartCounts.missingAgeUnder16 > 0}
            <br />
            Economic indicators (employment, social status etc) are not available
            for ages 0 to 15.
          {/if}
        </Notice>
      {/if}
      <div style:height="24px" />
    {/if}

    <Twisty
      title={!selected[0]
        ? "Start creating profile"
        : selected[2]
        ? "Change selected characteristics"
        : "Add another characteristic"}
      bind:open={selectOpen}
    >
      <OptionPicker
        options={varsNested}
        clickCallback={doSelect}
        removeCatCallback={(variable) => unSelect(variable.shortLabel)}
        globalSelectedCategories={selected}
        disabled={status === "loading"}
        bind:activeColumn
      />
    </Twisty>
  </div>
</Titleblock>

{#if status == "success" && selected.length > 0}
  <Cards title="Demographics" height="auto">
    <Card colspan={3} noBackground>
      <SimpleLegend
        >Number of people, age and sex compared to the population as a whole.</SimpleLegend
      >
    </Card>
    <PopulationTile {data} />
    <AgeProfileTile {data} {selected} />
    {#if !selected
      .map((d) => d.key)
      .includes("sex") && data.selected.residents["sex"].values !== "blocked"}
      <BarChartCard
        title="Sex"
        table={{ code: "sex", key: "Sex" }}
        {data}
        {chart_type}
      />
    {/if}
  </Cards>

  {#if totalPopIsAtLeast100(data)}
    <MapTiles
      {data}
      {mapStyle}
      {mapBounds}
      {maxBounds}
      {ladBounds}
      {selected}
      {colors}
    />
    {#each datasets[0].tablesCategorised as category}
      {#if category.shouldBeDisplayed && category.tables.some( (t) => chartIsAvailable(t.code, data) )}
        <Cards title={category.categoryName} height="auto">
          <Card colspan={3} noBackground>
            <SimpleLegend>{category.categoryDescription}</SimpleLegend>
          </Card>
          {#if category.qualityInformationHtml}
            <Card colspan={3} noBackground>
              <Caveat>{@html category.qualityInformationHtml}</Caveat>
            </Card>
          {/if}
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
  <div class="hide-when-printing">
    <Section title="Use this profile">
      <div class="use-this-profile-buttons">
        <Button on:click={printPage} variant="secondary" icon="print"
          >Print profile</Button
        >
        {#if totalPopIsAtLeast100(data)}
          <Button
            on:click={() => downloadData(data)}
            variant="secondary"
            icon="download">Download data (ODS, &lt;100 kB)</Button
          >
        {/if}
      </div>
    </Section>
    <ShareButtons title="Share this profile" />
  </div>
{/if}
<Divider />
<Section title="About the data" width="medium">
  <p>
    The data presented in this tool is derived from the <a href="https://www.ons.gov.uk/datasets/create">Create a custom dataset</a> service, which allows you to make your own datasets combining multiple census variables. <a href="https://www.ons.gov.uk/aboutus/transparencyandgovernance/datastrategy/datapolicies/statisticaldisclosurecontrol">Statistical disclosure control</a> methods are automatically applied to this data to ensure that the confidentiality of data subjects, including individuals and households, are protected.
  </p>
</Section>

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
      url('data:image/svg+xml;utf8,<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path fill="white" d="M17.9,7.3L13.2,12l4.7,4.7l-1.2,1.2L12,13.2l-4.7,4.7l-1.2-1.2l4.7-4.7L6.1,7.3l1.2-1.2l4.7,4.7l4.7-4.7L17.9,7.3z"/></svg>')
      no-repeat center;
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
  :global(.ons-panel) {
    margin-bottom: 0 !important;
  }

  @media print {
    .hide-when-printing {
      display: none;
    }
  }

  :global(.ons-grid h2) {
    font-size: 1.44444rem !important;
  }
</style>
