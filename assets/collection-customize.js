document.addEventListener("DOMContentLoaded", function () {
  const circleElements = document.querySelectorAll(".collection-grid");
  const xSymbols = document.querySelectorAll(".collection-grid-x-symbols");
  const circleImages = document.querySelectorAll(".collection-featured-image");
  const productsArea = document.getElementById("productsArea");
  const linkCollection = document.getElementById("collection-url");
  const firstCollectionUrl = linkCollection.dataset.url;

  // Skeleton loader removal
  circleImages.forEach((circle) => {
    const image = circle.querySelector("img");
    const skeleton = circle.querySelector(".skeleton");

    if (!image || !skeleton) return;
    if (image.complete && image.naturalHeight !== 0) {
      skeleton.remove();
      return;
    }
    image.addEventListener("load", () => {
      skeleton.remove();
    });

    image.addEventListener("error", () => {
      // Optional: remove skeleton even if image fails
      skeleton.remove();
    });
  });
  const removedSkeletonsProductCards = () => {
    if (productsArea) {
      const productCardsMainImages = productsArea.querySelectorAll(".product-images-container");
      if (productCardsMainImages) {
        productCardsMainImages.forEach((el) => {
          const image = el.querySelector(".collection-product-image");
          const skeleton = el.querySelector(".skeleton");

          if (!image || !skeleton) return;
          if (image.complete && image.naturalHeight !== 0) {
            skeleton.remove();
            return;
          }
          image.addEventListener("load", () => {
            skeleton.remove();
          });

          image.addEventListener("error", () => {
            // Optional: remove skeleton even if image fails
            skeleton.remove();
          });
        });
      }
    }
  };
  removedSkeletonsProductCards();

  // Lazy load products
  function lazyLoad() {
    const productsArea = document.getElementById("productsArea");
    const lazyProducts = productsArea.querySelectorAll(".lazy-product");
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "100px",
      },
    );

    lazyProducts.forEach((product) => observer.observe(product));
  }

  async function loadCollectionProducts(url) {
    // Fetch the collection page HTML
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error("Failed to load collection");

    const productsArea = document.getElementById("productsArea");
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const newProducts = doc.querySelector("#productsArea");
    if (!newProducts) throw new Error("Could not find products container in fetched page");
    productsArea.innerHTML = newProducts.innerHTML;
    removedSkeletonsProductCards();
  }

  function clickArrow() {
    const STEP = 60;
    const EPS = 1;

    function maxScroll(dotContainer) {
      return Math.max(0, dotContainer.scrollWidth - dotContainer.clientWidth);
    }

    function updateArrowState(item) {
      const backBtn = item.querySelector(".icon--back");
      const forwardBtn = item.querySelector(".icon--forward");
      const dotContainer = item.querySelector(".dot-container");
      if (!backBtn || !forwardBtn || !dotContainer) return;

      const max = maxScroll(dotContainer);
      backBtn.classList.toggle("active", dotContainer.scrollLeft > 0);
      forwardBtn.classList.toggle("active", dotContainer.scrollLeft < max - EPS);
    }

    document.addEventListener("click", (e) => {
      const backBtn = e.target.closest(".icon--back");
      const forwardBtn = e.target.closest(".icon--forward");
      if (!backBtn && !forwardBtn) return;

      const item = e.target.closest(".collection-product-item");
      if (!item) return;

      const dotContainer = item.querySelector(".dot-container");
      if (!dotContainer) return;

      e.preventDefault();
      e.stopPropagation();

      const delta = backBtn ? -STEP : STEP;

      const max = maxScroll(dotContainer);
      const target = dotContainer.scrollLeft + delta;
      const clamped = Math.max(0, Math.min(target, max));

      dotContainer.scrollTo({ left: clamped, behavior: "smooth" });
      setTimeout(() => updateArrowState(item), 300);
    });

    // optional: show/hide on hover using delegation too
    document.addEventListener(
      "mouseenter",
      (e) => {
        const wrapper = e.target.closest(".dots-and-arrows-container");
        if (!wrapper) return;
        if (wrapper.contains(e.relatedTarget)) return;

        const item = wrapper.closest(".collection-product-item");
        if (!item) return;

        const dotContainer = item.querySelector(".dot-container");
        if (!dotContainer) return;

        if (dotContainer.scrollWidth > dotContainer.clientWidth) {
          updateArrowState(item);
        }
      },
      true,
    );

    document.addEventListener(
      "mouseleave",
      (e) => {
        const wrapper = e.target?.closest(".dots-and-arrows-container");
        if (!wrapper) return;
        if (wrapper.contains(e.relatedTarget)) return;

        const item = wrapper.closest(".collection-product-item");
        if (!item) return;

        const backBtn = item.querySelector(".icon--back");
        const forwardBtn = item.querySelector(".icon--forward");
        if (!backBtn || !forwardBtn) return;

        backBtn.classList.remove("active");
        forwardBtn.classList.remove("active");
      },
      true,
    );
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
          container.scrollLeft + (e.left - c.left) - container.clientWidth / 2 + el.clientWidth / 2;

        const max = container.scrollWidth - container.clientWidth;
        const clamped = Math.max(0, Math.min(target, max));

        container.scrollTo({ left: clamped, behavior: "smooth" });
      }

      function activateDot(dotToActivate, url) {
        // if (!dotToActivate) return;

        if (url && image) {
          image.src = url;
          image.srcset = url;
        }

        removeDotsActiveClasses();
        if (dotToActivate) dotToActivate.classList.add("active");
      }

      layers.forEach((layer) => {
        layer.addEventListener("mouseover", function () {
          const url = layer.dataset.url;
          const id = layer.id;
          const dotToActivate = dotContainer.querySelector(`[data-id="${id}"]`);
          activateDot(dotToActivate, url);
          scrollXCenterToEl(dotContainer, dotToActivate);
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
    });
  }

  circleElements.forEach((circle) => {
    const xSymbol = circle.querySelector(".collection-grid-x-symbols");
    const circleImage = circle.querySelector(".collection-featured-image");
    // click on FILTER
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
        lazyLoad();
      } catch (e) {
        console.error(e);
      }
      hoverEffect();
      clickArrow();
    });
    if (xSymbol) {
      xSymbol.addEventListener("click", async function (e) {
        e.stopPropagation();
        circle.classList.remove("active");
        xSymbol.classList.remove("active");
        circleImage.classList.remove("active");
        await loadCollectionProducts(firstCollectionUrl);
        lazyLoad();
        hoverEffect();
      });
    }
  });
  lazyLoad();
  hoverEffect();
  clickArrow();
});
