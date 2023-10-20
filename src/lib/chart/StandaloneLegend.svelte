<script>
  import AgeProfileTile from "$lib/ui/tiles/AgeProfileTile.svelte";

  export let selected;
  export let xKey = "value";
  export let yKey = "category";
  export let zKey = "areanm";

  // if less than 1% use decimal formatting
  export let formatTick = (num) => num.toFixed(1);
  export let suffix = "%";
  export let base = null;
</script>

<ul aria-hidden="true" class="legend-block">
  <li>
    <div class="legend-vis bar" />
    <span class:bold={true}
      >People with {#if selected.length === 1}the following characteristic{:else}{#if selected.length === 2}both{:else}all{/if}
        of the following characteristics{/if}</span
    >
    <ul>
      {#each selected as s}
        <li>{`${s.topic}: ${s.label}`}</li>
      {/each}
    </ul>
  </li>
  <li>
    <div class="legend-vis bar2" />
    <span class:bold={false}>All people in England and Wales</span>
  </li>
  <p style="margin-top: 24px">
    Each grey bar shows the percentage of people in England and Wales that are
    in the given category. Each blue bar shows the percentage of people in your
    chosen group that are in the given category.
  </p>
</ul>

<style>
  .bold {
    font-weight: bold;
  }
  .label-group {
    margin: 4px 0 1px 0;
    line-height: 1.2;
    font-size: 0.9rem;
  }
  .label {
    line-height: 1.2;
    font-size: 0.9rem;
  }
  .bar-group {
    display: block;
    position: relative;
  }
  .bar-group > div {
    position: absolute;
    top: 0;
  }
  .bar {
    background-color: #206095;
  }
  .bar2 {
    background-color: #aaa;
  }
  ul.legend-block {
    list-style-type: none;
    padding: 0;
    margin: 0 0 5px 0;
  }
  ul.legend-block > li {
    margin: 0 10px 0 0;
    padding: 0;
  }
  .legend-vis {
    display: inline-block;
    transform: translate(0, 4px);
    width: 1rem;
    height: 1rem;
  }
</style>
