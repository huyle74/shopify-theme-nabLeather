document.addEventListener("DOMContentLoaded", function () {
  const circleElements = document.querySelectorAll(".collection-grid");
  const xSymbols = document.querySelectorAll(".collection-grid-x-symbols");
  const circleImages = document.querySelectorAll(".collection-featured-image");
  const productTitleInCards = document.querySelectorAll(
    ".collection-product-title"
  );
  const productDescriptionInCards = document.querySelectorAll(
    ".product-description"
  );

  productTitleInCards.forEach((title) => {
    const text = title.textContent;
    const finalText = text.length > 30 ? text.slice(0, 30) + "..." : text;
    title.textContent = finalText;
  });
  productDescriptionInCards.forEach((desc) => {
    const text = desc.textContent;
    const finalText = text.length > 40 ? text.slice(0, 40) + "..." : text;
    desc.textContent = finalText;
  });

  async function loadCollectionProducts(url) {
    // Fetch the collection page HTML
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error("Failed to load collection");

    const productsArea = document.getElementById("productsArea");
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const newProducts = doc.querySelector("#productsArea");

    newProducts
      .querySelectorAll(".collection-product-title")
      .forEach((title) => {
        const text = title.textContent;
        const finalText = text.length > 30 ? text.slice(0, 30) + "..." : text;
        title.textContent = finalText;
      });

    newProducts.querySelectorAll(".product-description").forEach((desc) => {
      const text = desc.textContent;
      const finalText = text.length > 30 ? text.slice(0, 30) + "..." : text;
      desc.textContent = finalText;
    });
    if (!newProducts)
      throw new Error("Could not find products container in fetched page");
    productsArea.innerHTML = newProducts.innerHTML;
  }

  function hoverEffect() {
    // product hover effect
    const productItems = document.querySelectorAll(".collection-product-item");
    productItems.forEach((item) => {
      // const imageContainer = item.querySelector(".product-images-container");
      const image = item.querySelector(".collection-product-image");
      const dots = item.querySelectorAll(".image-dot");
      const layerContainer = item.querySelector(".layer-container");
      const dotContainer = item.querySelector(".dot-container");
      const layers = layerContainer.querySelectorAll(".layer-for-hover");

      function removeDotsActiveClasses() {
        dots.forEach((dot) => dot.classList.remove("active"));
      }

      function scrollXCenterToEl(container, el) {
        if (!container || !el) return;

        // robust math (works with padding / gaps)
        const c = container.getBoundingClientRect();
        const e = el.getBoundingClientRect();

        const target =
          container.scrollLeft +
          (e.left - c.left) -
          container.clientWidth / 2 +
          el.clientWidth / 2;

        const max = container.scrollWidth - container.clientWidth;
        const clamped = Math.max(0, Math.min(target, max));

        container.scrollTo({ left: clamped, behavior: "smooth" });
      }

      let currentObserved = null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry || !currentObserved) return;

          // If less than 70% visible, scroll it into center
          if (entry.intersectionRatio < 0.7) {
            scrollXCenterToEl(dotContainer, currentObserved);
          }
        },
        {
          root: dotContainer,
          threshold: [0, 0.7, 1],
        }
      );
      function activateDot(dotToActivate, url) {
        if (!dotToActivate) return;

        if (url && image) {
          image.src = url;
          image.srcset = url;
        }

        removeDotsActiveClasses();
        dotToActivate.classList.add("active");

        // observe only the active dot
        if (currentObserved) observer.unobserve(currentObserved);
        currentObserved = dotToActivate;
        observer.observe(dotToActivate);
      }

      layers.forEach((layer) => {
        layer.addEventListener("mouseover", function () {
          const url = layer.dataset.url;
          const id = layer.id;
          const dotToActivate = dotContainer.querySelector(`[data-id="${id}"]`);
          activateDot(dotToActivate, url);
        });
      });

      dots.forEach((dot) => {
        dot.addEventListener("mouseover", function () {
          removeDotsActiveClasses();
          const url = this.dataset.url;
          if (url && image) {
            image.src = url;
            image.srcset = url;
          }
          this.classList.add("active");
        });
      });
      if (dotContainer) {
        let countDots = dotContainer.children.length;
        console.log(countDots);
      }
    });
  }

  circleElements.forEach((circle) => {
    circle.addEventListener("click", async function () {
      circleElements.forEach((i) => i.classList.remove("active"));
      xSymbols.forEach((i) => i.classList.remove("active"));
      circleImages.forEach((i) => i.classList.remove("active"));

      this.classList.add("active");
      const xSymbol = this.querySelector(".collection-grid-x-symbols");
      const circleImage = this.querySelector(".collection-featured-image");
      if (xSymbol) {
        xSymbol.classList.add("active");
      }
      if (circleImage) {
        circleImage.classList.add("active");
      }
      const url = this.dataset.url;
      if (!url) return;

      try {
        await loadCollectionProducts(url);
      } catch (e) {
        console.error(e);
      }
      hoverEffect();
    });
  });
  hoverEffect();
});
