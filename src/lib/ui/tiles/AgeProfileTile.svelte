<script>
  import { Card } from "@onsvisual/svelte-components";
  import ProfileChart from "$lib/chart/ProfileChart.svelte";

  import { texts } from "$lib/config";
  import { makeDataNew } from "$lib/utils";

  export let data;
  export let selected;
</script>

<Card title="Age profile">
  {#if data.statusOfVariables.resident_age_18b !== "available"}
    <span class="num-desc">{texts.nodata}</span>
  {:else}
    <ProfileChart
      data={data.selected && makeDataNew("residents", "resident_age_18b", data)}
      zKey="group"
      base="% of all people"
      showLegend={false}
    />
  {/if}
</Card>

<style>
  .num-desc {
    display: block;
    margin-top: 10px;
    color: #707070;
    font-size: 14px;
    line-height: 1.3;
  }
</style>
