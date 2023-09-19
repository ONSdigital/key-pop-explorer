<script>
  export let markerWidth = 3;
</script>

<ul class="legend-block">
  {#each [
    "People with the selected characteristics",
    "All people in England and Wales"
  ] as group, i}
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

<style>
  ul.legend-block {
    list-style-type: none;
    padding: 0;
    margin: 0;
    font-size: 14px;
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
  .bar {
    background-color: #27a0cc;
  }
  .marker {
    border-left-color: black;
    border-left-style: solid;
  }
</style>