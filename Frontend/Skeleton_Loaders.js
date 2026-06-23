(function () {
  function repeat(count, template) {
    return Array.from({ length: count }, template).join("");
  }

  function setBusy(element, isBusy) {
    if (!element) return;
    if (isBusy) {
      element.setAttribute("aria-busy", "true");
      return;
    }

    element.removeAttribute("aria-busy");
  }

  function render(element, html) {
    if (!element) return;
    setBusy(element, true);
    element.innerHTML = html;
  }

  function markLoaded(element) {
    setBusy(element, false);
  }

  function line(width, extraClass = "") {
    return `<span class="skeleton-line ${extraClass}" style="width: ${width};"></span>`;
  }

  function block(extraClass = "") {
    return `<span class="skeleton-block ${extraClass}"></span>`;
  }

  function showHomePlaceCards(element, count = 4) {
    render(element, repeat(count, () => `
      <article class="place-card card skeleton-card" aria-hidden="true">
        <div class="place-card-body">
          <span class="skeleton-pill"></span>
          ${line("74%", "is-title")}
          ${block("skeleton-image")}
          ${line("58%", "is-compact")}
          ${line("42%", "is-compact")}
          ${line("95%")}
          ${line("82%")}
          ${line("65%", "is-compact")}
          <span class="skeleton-button"></span>
        </div>
      </article>
    `));
  }

  function showCollectionCards(element, count = 8) {
    render(element, repeat(count, () => `
      <article class="place-card skeleton-card" aria-hidden="true">
        ${block("skeleton-image")}
        <div class="place-card-body">
          <div class="skeleton-row">
            <span class="skeleton-pill"></span>
            ${line("46px", "is-compact")}
          </div>
          ${line("72%", "is-title")}
          ${line("44%", "is-compact")}
          ${line("96%")}
          ${line("86%")}
          ${line("62%", "is-compact")}
          <span class="skeleton-button"></span>
        </div>
      </article>
    `));
  }

  function showTrendCards(element, count = 6) {
    render(element, repeat(count, () => `
      <article class="trend-card skeleton-card" aria-hidden="true">
        <div class="trend-image-wrap">
          ${block("skeleton-image")}
          <span class="rank-badge skeleton-chip"></span>
        </div>
        <div class="trend-card-body">
          <div class="skeleton-row">
            <span class="skeleton-pill"></span>
            ${line("58px", "is-compact")}
          </div>
          ${line("76%", "is-title")}
          ${line("44%", "is-compact")}
          ${line("94%")}
          ${line("82%")}
          ${line("58%", "is-compact")}
          <span class="skeleton-button"></span>
        </div>
      </article>
    `));
  }

  function showSavedItems(element, count = 3) {
    render(element, repeat(count, () => `
      <article class="saved-item skeleton-card" aria-hidden="true">
        <span class="skeleton-block" style="width: 46px; height: 46px;"></span>
        <div>
          ${line("72%", "is-title")}
          ${line("58%", "is-compact")}
        </div>
        ${line("32px", "is-compact")}
      </article>
    `));
  }

  function showActivityItems(element, count = 3) {
    render(element, repeat(count, () => `
      <article class="activity-item skeleton-card" aria-hidden="true">
        ${line("42%", "is-title")}
        ${line("76%", "is-compact")}
      </article>
    `));
  }

  function showStat(element) {
    if (!element) return;
    element.textContent = "";
    element.classList.add("skeleton-stat-number");
    element.setAttribute("aria-busy", "true");
  }

  function showField(element) {
    if (!element) return;
    element.classList.add("skeleton-field");
    element.setAttribute("aria-busy", "true");
  }

  function clearField(element) {
    if (!element) return;
    element.classList.remove("skeleton-field");
    element.removeAttribute("aria-busy");
  }

  function showCreationToolbar(elements = {}) {
    [
      elements.title,
      elements.status,
      elements.date,
      elements.timeframe
    ].forEach(showField);
  }

  function clearCreationToolbar(elements = {}) {
    [
      elements.title,
      elements.status,
      elements.date,
      elements.timeframe
    ].forEach(clearField);
  }

  function clearStat(element) {
    if (!element) return;
    element.classList.remove("skeleton-stat-number");
    element.removeAttribute("aria-busy");
  }

  function showSpotTiles(element, count = 6) {
    render(element, repeat(count, () => `
      <article class="spot-tile skeleton-card" aria-hidden="true">
        <span class="skeleton-pill"></span>
        ${line("78%", "is-title")}
        ${block("skeleton-image")}
        ${line("92%", "is-compact")}
        ${line("70%", "is-compact")}
      </article>
    `));
  }

  function showPlaybookCards(element, count = 2) {
    render(element, repeat(count, () => `
      <article class="playbook-card skeleton-card" aria-hidden="true">
        <span class="skeleton-pill"></span>
        ${line("78%", "is-title")}
        ${block("skeleton-image")}
        ${line("54%", "is-compact")}
        ${line("72%", "is-compact")}
        <span class="skeleton-button"></span>
      </article>
    `));
  }

  function showOutingCards(element, count = 3) {
    render(element, repeat(count, () => `
      <article class="outing-card skeleton-card" aria-hidden="true">
        <div class="outing-actions">
          ${line("58px", "is-compact")}
          ${line("24px", "is-compact")}
        </div>
        ${line("68%", "is-title")}
        ${line("56%", "is-compact")}
        ${line("62%", "is-compact")}
        <div class="outing-images">
          ${block()}
          ${block()}
          ${block()}
          ${block()}
        </div>
        ${line("82%", "is-compact")}
      </article>
    `));
  }

  function showCreationPlaybook(element, count = 3) {
    render(element, repeat(count, () => `
      <article class="collection-card skeleton-card" aria-hidden="true">
        <span class="skeleton-pill"></span>
        ${line("86%", "is-title")}
        ${block("skeleton-image")}
        ${line("68%", "is-compact")}
        ${line("84%", "is-compact")}
        ${line("52%", "is-compact")}
        <span class="skeleton-button"></span>
      </article>
    `));
  }

  function showWorkspace(element) {
    render(element, `
      <div class="workspace-shell skeleton-workspace-shell" aria-hidden="true">
        <div class="workspace-summary">
          ${repeat(3, () => `
            <div class="workspace-stat skeleton-card">
              ${line("46px", "is-compact")}
              ${line("64%", "is-title")}
            </div>
          `)}
        </div>
        <div class="workspace-list">
          ${repeat(3, () => `
          <article class="workspace-place-card skeleton-card">
            <span class="skeleton-circle" style="width: 32px; height: 32px;"></span>
            ${block("skeleton-workspace-image")}
            <div class="workspace-place-body">
              <div class="workspace-place-heading">
                ${line("48%", "is-title")}
                <span class="skeleton-pill" style="width: 48px;"></span>
              </div>
              ${line("34%", "is-compact")}
              <div class="skeleton-row skeleton-workspace-tags">
                <span class="skeleton-pill" style="width: 64px;"></span>
                <span class="skeleton-pill" style="width: 92px;"></span>
              </div>
            </div>
            <div class="workspace-actions">
              ${line("28px", "is-compact")}
              ${line("28px", "is-compact")}
              ${line("28px", "is-compact")}
            </div>
          </article>
          `)}
        </div>
      </div>
    `);
  }

  function showContributors(element, count = 3) {
    render(element, `
      <div class="skeleton-cluster" aria-hidden="true">
        ${repeat(count, () => `
          <div class="contributor-row skeleton-card">
            ${line("68%", "is-compact")}
            <span class="skeleton-circle" style="width: 18px; height: 18px;"></span>
            ${line("80px", "is-compact")}
            ${line("22px", "is-compact")}
          </div>
        `)}
        ${line("82%", "is-compact")}
      </div>
    `);
  }

  function showBudget(element) {
    render(element, `
      <div class="skeleton-cluster" aria-hidden="true">
        ${line("58%", "is-compact")}
        ${line("76%", "is-title")}
        ${line("92%")}
        ${line("84%")}
        ${line("68%")}
      </div>
    `);
  }

  function showMap(element) {
    render(element, `
      <div class="skeleton-map-shell" aria-hidden="true">
        <span class="skeleton-map-route"></span>
        ${line("54%", "is-compact")}
        ${line("38%", "is-compact")}
      </div>
    `);
  }

  window.ChicagoInsiderSkeletons = {
    clearStat,
    clearCreationToolbar,
    markLoaded,
    setBusy,
    showActivityItems,
    showBudget,
    showCollectionCards,
    showContributors,
    showCreationPlaybook,
    showCreationToolbar,
    showHomePlaceCards,
    showMap,
    showOutingCards,
    showPlaybookCards,
    showSavedItems,
    showSpotTiles,
    showStat,
    showTrendCards,
    showWorkspace
  };
})();
