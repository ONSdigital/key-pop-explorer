<script>
  /**
   * A title for the element
   * @type {string}
   */
  export let title = "Title";
  /**
   * Option for element to be open/expanded by default
   * @type {boolean}
   */
  export let open = false;
</script>

<details class="ons-collapsible ons-js-collapsible" bind:open>
  <summary
    class="ons-collapsible__heading ons-js-collapsible-heading"
    data-ga-action={open ? "Close panel" : "Open panel"}
  >
    <h3 class="ons-btn" class:ons-btn--secondary={open}>
      <span class="ons-btn__inner">{open ? "Close panel" : title}</span>
    </h3>
  </summary>
  <div class="ons-collapsible__content ons-js-collapsible-content">
    <slot />
  </div>
</details>

<style>
  details {
    display: flex;
    flex-direction: column-reverse;
  }
  details > * {
    position: relative;
  }
  .ons-collapsible__heading {
    color: var(--link, --ons-color-text-link);
    padding: 0;
  }
  .ons-collapsible__heading:hover {
    color: var(--link-hover, --ons-color-text-link-hover);
  }
</style>
