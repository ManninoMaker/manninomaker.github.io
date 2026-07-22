(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char]
    );

  function safeHref(value) {
    const href = String(value || "").trim();

    if (!href || /^(javascript:|vbscript:)/i.test(href)) {
      return "";
    }

    if (
      /^(https?:|mailto:|data:image\/|blob:|\/|\.\/|\.\.\/|#)/i.test(href)
    ) {
      return href;
    }

    // Consente normali percorsi relativi come:
    // assets/projects/nome-progetto/foto.png
    // downloads/nome-file.zip
    if (/^[^<>:"|?*]+(?:\/[^<>:"|?*]+)+$/.test(href)) {
      return href;
    }

    return "";
  }

  function isExternalUrl(value) {
    return /^https?:/i.test(String(value || "").trim());
  }

  function resolveFromProjectPage(value) {
    const href = safeHref(value);

    if (!href) {
      return "";
    }

    // Link esterni, assoluti o già relativi restano invariati.
    if (
      /^(https?:|mailto:|data:image\/|blob:|\/|\.\/|\.\.\/|#)/i.test(href)
    ) {
      return href;
    }

    // I percorsi presenti in projects.json partono dalla root del sito.
    // La pagina dettagli si trova dentro /progetti/, quindi aggiungiamo ../
    return `../${href}`;
  }

  function getCurrentSlug() {
    const filename = decodeURIComponent(
      window.location.pathname.split("/").pop() || ""
    );

    return filename.replace(/\.html?$/i, "").trim();
  }

  function readEmbeddedFallback() {
    const block = $("#mm-project-data");

    if (!block) {
      return null;
    }

    try {
      return JSON.parse(block.textContent);
    } catch (error) {
      console.error("Dati incorporati del progetto non validi:", error);
      return null;
    }
  }

  async function readProjectFromCatalog() {
    const slug = getCurrentSlug();
    const catalogUrl = new URL("../projects.json", window.location.href);

    const response = await fetch(catalogUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Impossibile leggere projects.json: HTTP ${response.status}`);
    }

    const catalog = await response.json();

    if (!Array.isArray(catalog)) {
      throw new Error("projects.json non contiene un elenco valido.");
    }

    const project = catalog.find((item) => {
      if (!item) {
        return false;
      }

      const itemSlug = String(item.slug || "").trim();
      const itemUrl = String(item.url || item.page_url || "").trim();
      const urlFilename = decodeURIComponent(itemUrl.split("/").pop() || "");
      const urlSlug = urlFilename.replace(/\.html?$/i, "");

      return itemSlug === slug || urlSlug === slug;
    });

    if (!project) {
      throw new Error(`Progetto "${slug}" non trovato in projects.json.`);
    }

    return project;
  }

  function renderProject(data) {
    document.title = `${data.title || "Progetto"} — Mannino Maker`;

    $("#projectEyebrow").textContent =
      `${data.category || "Progetto"} · ${data.status || "Progetto"}`;

    $("#projectTitle").textContent = data.title || "Progetto";
    $("#projectDescription").textContent =
      data.short_description || data.description || "";

    $("#projectCategory").textContent = data.category || "—";
    $("#projectStatus").textContent = data.status || "—";
    $("#projectLevel").textContent = data.level || "—";

    const rawDate = data.date || data.created_at;
    const parsedDate = rawDate ? new Date(`${rawDate}T12:00:00`) : null;

    $("#projectDate").textContent =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? new Intl.DateTimeFormat("it-IT").format(parsedDate)
        : "—";

    const technologies = Array.isArray(data.technologies)
      ? data.technologies
      : [];

    $("#projectTechnologies").innerHTML = technologies
      .map((item) => `<span>${esc(item)}</span>`)
      .join("");

    const visual = $("#projectVisual");
    const coverImage = resolveFromProjectPage(data.image_url);

    visual.innerHTML = coverImage
      ? `<img src="${esc(coverImage)}" alt="${esc(data.title || "")}">`
      : `<span>${esc(data.icon || "MM")}</span>`;

    const features = Array.isArray(data.features) ? data.features : [];
    $("#projectFeatures").innerHTML = features
      .map((item) => `<li>${esc(item)}</li>`)
      .join("");
    $("#featuresPanel").classList.toggle("hidden", features.length === 0);

    const files = Array.isArray(data.files) ? data.files : [];
    $("#projectFiles").innerHTML = files
      .map((item) => `<span>${esc(item)}</span>`)
      .join("");
    $("#filesPanel").classList.toggle("hidden", files.length === 0);

    //renderProjectButton(data);
    renderLinks(data);
    renderGallery(data);

    const email = "g.mannino.info@gmail.com";
    $("#projectMail").href =
      `mailto:${email}?subject=${encodeURIComponent(
        `Informazioni progetto: ${data.title || ""}`
      )}`;
  }

  function renderProjectButton(data) {
    const projectButton = $("#projectButton");
    const projectUrl = safeHref(data.project_url);

    if (projectUrl) {
      projectButton.href = projectUrl;
      projectButton.classList.remove("disabled");
      projectButton.removeAttribute("aria-disabled");
      projectButton.removeAttribute("title");

      if (isExternalUrl(projectUrl)) {
        projectButton.target = "_blank";
        projectButton.rel = "noopener";
      }
    } else {
      projectButton.removeAttribute("href");
      projectButton.removeAttribute("target");
      projectButton.removeAttribute("rel");
      projectButton.classList.add("disabled");
      projectButton.setAttribute("aria-disabled", "true");
      projectButton.title =
        "Inserisci il link nel campo project_url di projects.json";
    }
  }

  function renderLinks(data) {
    const links = Array.isArray(data.links)
      ? data.links.filter((item) => item && safeHref(item.url))
      : [];

    $("#projectLinks").innerHTML = links
      .map((item) => {
        const url = resolveFromProjectPage(item.url);
        const externalAttributes = isExternalUrl(url)
          ? 'target="_blank" rel="noopener"'
          : "";

        return `
          <a
            class="button ${item.style === "primary" ? "primary" : ""}"
            href="${esc(url)}"
            ${externalAttributes}
          >
            ${esc(item.label || "Apri link")} ↗
          </a>
        `;
      })
      .join("");

    $("#linksPanel").classList.toggle("hidden", links.length === 0);
  }

  function renderGallery(data) {
    const gallerySection = $("#gallerySection");
    const galleryContainer = $("#projectGallery");

    const gallery = (Array.isArray(data.gallery) ? data.gallery : [])
      .map((item) => (typeof item === "string" ? { image: item } : item))
      .filter((item) => item && safeHref(item.image))
      .map((item) => ({
        ...item,
        image: resolveFromProjectPage(item.image),
      }));

    galleryContainer.innerHTML = "";

    if (!gallery.length) {
      gallerySection.classList.add("hidden");
      return;
    }

    gallerySection.classList.remove("hidden");

    galleryContainer.innerHTML = gallery
      .map(
        (item, index) => `
          <figure
            class="gallery-item"
            data-gallery-index="${index}"
            tabindex="0"
            role="button"
            aria-label="Apri immagine: ${esc(
              item.caption || data.title || ""
            )}"
          >
            <img
              src="${esc(item.image)}"
              alt="${esc(item.caption || data.title || "")}"
              loading="lazy"
            >
            ${
              item.caption
                ? `<figcaption>${esc(item.caption)}</figcaption>`
                : ""
            }
          </figure>
        `
      )
      .join("");

    galleryContainer.querySelectorAll("img").forEach((image) => {
      image.addEventListener("error", () => {
        console.error(
          "Immagine della galleria non trovata:",
          image.getAttribute("src")
        );
        image.closest(".gallery-item")?.classList.add("gallery-image-error");
      });
    });

    createLightbox(gallery, data.title || "Immagine progetto");
  }

  function createLightbox(gallery, defaultTitle) {
    document.querySelector(".project-lightbox")?.remove();

    const lightbox = document.createElement("div");
    lightbox.className = "project-lightbox";
    lightbox.setAttribute("aria-hidden", "true");

    lightbox.innerHTML = `
      <button
        type="button"
        class="project-lightbox-close"
        aria-label="Chiudi immagine"
      >&times;</button>

      <button
        type="button"
        class="project-lightbox-nav project-lightbox-prev"
        aria-label="Immagine precedente"
      >&#10094;</button>

      <figure class="project-lightbox-content">
        <img class="project-lightbox-image" src="" alt="">
        <figcaption class="project-lightbox-caption"></figcaption>
      </figure>

      <button
        type="button"
        class="project-lightbox-nav project-lightbox-next"
        aria-label="Immagine successiva"
      >&#10095;</button>
    `;

    document.body.appendChild(lightbox);

    const galleryContainer = $("#projectGallery");
    const lightboxImage = lightbox.querySelector(".project-lightbox-image");
    const lightboxCaption = lightbox.querySelector(
      ".project-lightbox-caption"
    );
    const closeButton = lightbox.querySelector(".project-lightbox-close");
    const prevButton = lightbox.querySelector(".project-lightbox-prev");
    const nextButton = lightbox.querySelector(".project-lightbox-next");

    let currentIndex = 0;
    let lastFocusedItem = null;

    const showImage = (index) => {
      currentIndex = (index + gallery.length) % gallery.length;
      const item = gallery[currentIndex];

      lightboxImage.src = item.image;
      lightboxImage.alt = item.caption || defaultTitle;
      lightboxCaption.textContent = item.caption || "";
    };

    const openLightbox = (index, trigger) => {
      lastFocusedItem = trigger || null;
      showImage(index);
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
      closeButton.focus();
    };

    const closeLightbox = () => {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");
      lightboxImage.src = "";

      if (lastFocusedItem) {
        lastFocusedItem.focus();
      }
    };

    galleryContainer.addEventListener("click", (event) => {
      const item = event.target.closest(".gallery-item");

      if (!item) {
        return;
      }

      openLightbox(Number(item.dataset.galleryIndex), item);
    });

    galleryContainer.addEventListener("keydown", (event) => {
      const item = event.target.closest(".gallery-item");

      if (!item || !["Enter", " "].includes(event.key)) {
        return;
      }

      event.preventDefault();
      openLightbox(Number(item.dataset.galleryIndex), item);
    });

    closeButton.addEventListener("click", closeLightbox);
    prevButton.addEventListener("click", () => showImage(currentIndex - 1));
    nextButton.addEventListener("click", () => showImage(currentIndex + 1));

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!lightbox.classList.contains("open")) {
        return;
      }

      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        showImage(currentIndex - 1);
      }

      if (event.key === "ArrowRight") {
        showImage(currentIndex + 1);
      }
    });

    if (gallery.length < 2) {
      prevButton.classList.add("hidden");
      nextButton.classList.add("hidden");
    }
  }

  async function init() {
    let data = null;

    try {
      data = await readProjectFromCatalog();
      console.info("Progetto caricato da projects.json:", data.slug || data.title);
    } catch (error) {
      console.error(error);

      // Riserva: evita una pagina vuota se projects.json non è disponibile.
      data = readEmbeddedFallback();

      if (data) {
        console.warn(
          "Uso temporaneamente i dati incorporati nella pagina perché projects.json non è disponibile."
        );
      }
    }

    if (!data) {
      $("#projectTitle").textContent = "Progetto non disponibile";
      $("#projectDescription").textContent =
        "Il progetto non è stato trovato in projects.json.";
      return;
    }

    renderProject(data);
  }

  init();
})();
