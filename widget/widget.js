/**
 * Embeddable testimonial widget.
 *
 * Usage on a third-party page:
 *   <div id="testimonial-widget"
 *        data-api="http://localhost:4000"
 *        data-accent="#b23a2e"
 *        data-limit="6"></div>
 *   <script src="http://localhost:4000/widget.js"></script>
 *
 * No build step, no dependencies — a page just drops this <script> tag in.
 * Renders inside a Shadow DOM so the host site's CSS can't leak in or out.
 */
(function () {
  function initWidget(host) {
    const apiBase = host.dataset.api || "http://localhost:4000";
    const accent = host.dataset.accent || "#b23a2e";
    const limit = Number(host.dataset.limit) || 6;

    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      * { box-sizing: border-box; }
      .tw-wrap {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
      }
      .tw-card {
        background: #fdfbf6;
        border: 1px solid #e3ddc9;
        border-radius: 8px;
        padding: 16px 18px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      }
      .tw-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .tw-avatar {
        width: 30px; height: 30px; border-radius: 50%; object-fit: cover;
        background: ${accent}; color: #fff; display: flex; align-items: center;
        justify-content: center; font-size: 13px; font-weight: 600;
      }
      .tw-name { font-weight: 600; font-size: 13px; color: #222; }
      .tw-company { font-size: 11px; color: #888; }
      .tw-stars { color: #c9a227; font-size: 13px; letter-spacing: 1px; margin-bottom: 6px; }
      .tw-body { font-size: 14px; line-height: 1.45; color: #333; margin: 0; }
      .tw-empty, .tw-error, .tw-loading {
        font-size: 13px; color: #888; padding: 24px; text-align: center;
      }
      .tw-error { color: ${accent}; }
      .tw-footer { text-align: center; margin-top: 16px; }
      .tw-footer a { font-size: 11px; color: #999; text-decoration: none; }
    `;
    shadow.appendChild(style);

    const wrap = document.createElement("div");
    wrap.className = "tw-wrap";
    wrap.innerHTML = `<div class="tw-loading">Loading testimonials…</div>`;
    shadow.appendChild(wrap);

    fetch(`${apiBase}/api/testimonials/approved?limit=${limit}&page=1`)
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => {
        const items = data.items || [];
        if (items.length === 0) {
          wrap.innerHTML = `<div class="tw-empty">No testimonials yet.</div>`;
          return;
        }
        wrap.innerHTML = items.map(renderCard).join("");
      })
      .catch(() => {
        wrap.innerHTML = `<div class="tw-error">Couldn't load testimonials.</div>`;
      });

    function renderCard(t) {
      const stars = "★".repeat(t.rating) + "☆".repeat(5 - t.rating);
      const avatar = t.photo_path
        ? `<img class="tw-avatar" src="${apiBase}${t.photo_path}" alt="" />`
        : `<div class="tw-avatar">${escapeHtml(t.name.slice(0, 1).toUpperCase())}</div>`;
      return `
        <div class="tw-card">
          <div class="tw-head">
            ${avatar}
            <div>
              <div class="tw-name">${escapeHtml(t.name)}</div>
              ${t.company ? `<div class="tw-company">${escapeHtml(t.company)}</div>` : ""}
            </div>
          </div>
          <div class="tw-stars">${stars}</div>
          <p class="tw-body">"${escapeHtml(t.body)}"</p>
        </div>`;
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }
  }

  function boot() {
    document.querySelectorAll("#testimonial-widget, [data-testimonial-widget]").forEach(initWidget);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
