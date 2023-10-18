<p class="legend-text">
  <slot />
</p>
<ul class="legend-block">
  {#each ["People with the selected characteristics", "All people in England and Wales"] as group, i}
    <li class:ew={i != 0}>
      <div class="legend-vis {i == 0 ? 'bar' : 'marker'}" />
      <span class={i == 0 ? "bold" : "brackets"}>{group}</span>
    </li>
  {/each}
</ul>

<style>
  p.legend-text {
    display: block;
    margin: -10px 0 6px;
    font-size: 16px;
  }
  ul.legend-block {
    list-style-type: none;
    padding: 0;
    margin: 0;
    font-size: 14px;
  }
  ul.legend-block > li {
    display: inline-flex;
    margin: 0 4px 0 0;
    padding: 0;
  }
  .legend-vis {
    display: inline-block;
    height: 18px;
    transform: translate(0, 3px);
  }
  .bar {
    background-color: #27a0cc;
    width: 18px;
    margin: 0 6px 0 0;
  }
  .marker {
    border-left-color: black;
    border-left-style: solid;
    width: 3px;
    margin: 0 6px 0 15px;
  }
  .bold {
    font-weight: bold;
  }
  .brackets::before {
    content: "(";
  }
  .brackets::after {
    content: ")";
  }
</style>
