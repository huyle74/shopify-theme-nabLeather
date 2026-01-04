document.addEventListener("DOMContentLoaded", function () {
  const variants = this.querySelector(".variants-container");
  const colorContainer = variants?.querySelector(".color-size-variant-container") || null;
  const sizeContainer = variants?.querySelector(".variant-size") || null;
  const inputVariant = this.querySelector('input[name="id"]');
  const cartButton = this.querySelector("button[data-action='add-to-cart']");

  // CHECK IF ONLY COLOR OR SIZE EXISTS
  const have2Options = this.getElementById("2-variant-existed") || null;
  const doNotHaveOption = this.getElementById("do-not-have-variant") || null;
  if (doNotHaveOption) {
    cartButton.removeAttribute("disabled");
    cartButton.setAttribute("aria-disabled", "false");
  }

  // Add active class to first color and size option by default
  // DATA variant mapping
  const productJsonEl = document.querySelector('[id^="ProductJson-"]');
  if (!productJsonEl) return;
  const productData = JSON.parse(productJsonEl.textContent);

  // product don not have variants
  if (productData.variants.length <= 1) {
    inputVariant.value = productData.variants[0].id;
    inputVariant.dispatchEvent(new Event("change", { bubbles: true }));
    inputVariant.dispatchEvent(new Event("input", { bubbles: true }));
  }

  const variantArray = [];
  productData.variants.forEach((variant) => {
    const color = variant.options[0];
    if (!variantArray.includes(color)) {
      variantArray.push(color);
    }
  });
  const variantData = {};
  variantArray.forEach((color) => {
    variantData[color] = productData.variants.filter((variant) => variant.options[0] === color);
  });
  // console.log(productData.variants);
  // ////////////////////////////////////////////////

  // set gallery image based on color selection
  const sideMediaContainer = this.querySelector(".side-product-media-container");
  function setGalleryByVariantId(variantId) {
    const allSideMedias = sideMediaContainer.querySelectorAll(".product-media");
    const idStr = String(variantId);

    allSideMedias.forEach((item) => {
      const ids = item.dataset.variantId.split(",").map((id) => id.trim()); // Convert to array of strings
      // console.log(ids);

      const show = ids.includes(idStr);
      item.style.display = show ? "" : "none";
      item.classList.toggle("is-active", show);
    });
  }

  // Set input value based on selected options
  function setInputValue() {
    // if (!optionType) return null;
    const selectedColor = colorContainer
      ? colorContainer.querySelector(".variant-image.active") || null
      : null;
    const selectedSize = sizeContainer
      ? sizeContainer.querySelector(".title-size.active") || null
      : null;
    if (!selectedColor && !selectedSize) return null;
    const colorValue = selectedColor ? selectedColor.getAttribute("data_option_value") : null;
    // console.log(colorValue);
    const sizeValue = selectedSize ? selectedSize.getAttribute("data-option-value") : null;
    // console.log(sizeValue);

    if (!have2Options) {
      if (!colorValue && !sizeValue) return null;
    } else {
      if (!colorValue || !sizeValue) return null;
    }

    const variantId = productData.variants.find((variant) => {
      let sizeMatch = false;
      let colorMatch = false;
      colorMatch = colorValue ? variant.options[0] === colorValue : true;
      sizeMatch = sizeValue ? variant.options[1] === sizeValue : true;
      if (!sizeMatch) {
        sizeMatch = sizeValue ? variant.options[0] === sizeValue : true;
      }
      return colorMatch && sizeMatch;
    });

    if (!variantId) {
      return null;
    }

    // Set the variant id to input
    inputVariant.value = variantId.id;

    inputVariant.dispatchEvent(new Event("change", { bubbles: true }));
    inputVariant.dispatchEvent(new Event("input", { bubbles: true }));
  }
  setInputValue();

  // DOM Manipulation for size and color selection
  const productMediaContainer = this.querySelector(".product-gallery-info-container");
  const mainMedia = this.getElementById("product-media-container-for-scroll");
  const slides = mainMedia.querySelectorAll(".product-media");
  const dotsContainer = this.querySelector(".dots-container");
  const dots = dotsContainer.querySelectorAll(".dot");
  const wrappers = document.querySelectorAll(".product-media-wrapper");

  // ZOOM FUNCTIONALITY
  if (mainMedia) {
    const wrappers = document.querySelectorAll(".product-media-wrapper");
    wrappers.forEach((wrapper) => {
      let clicked = false;
      const slide = wrapper.querySelector(".product-media");
      wrapper.addEventListener("pointerdown", (e) => e.stopPropagation());

      slide.addEventListener("click", (e) => {
        e.stopPropagation();

        slide.style.transform = "translate3d(0,0,0) scale(1.6)";
        document.querySelectorAll(".product-media.zoomed").forEach((img) => {
          if (img !== slide) img.classList.remove("zoomed");
        });
        slide.classList.toggle("zoomed");

        if (clicked) {
          slide.classList.remove("zoomed");
          slide.style.transform = "translate3d(0,0,0) scale(1)";
        }
        clicked = !clicked;
      });
      // max move in px (increase for stronger effect)
      const maxMove = 60;
      const intensity = 3;
      function onMove(e) {
        const rect = wrapper.getBoundingClientRect();

        // mouse position inside element: 0..1
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // convert to -1..1 (center = 0)
        const dx = (x - 0.5) * 2;
        const dy = (y - 0.5) * 2;

        // REVERSE direction: negate
        const tx = -dx * maxMove * intensity;
        const ty = -dy * maxMove * intensity;

        slide.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(1.6)`;
      }

      function onLeave() {
        slide.style.transform = "translate3d(0,0,0) scale(1)";
        clicked = false;
        slide.classList.remove("zoomed");
      }

      wrapper.addEventListener("mousemove", (e) => {
        if (!slide.classList.contains("zoomed")) return;
        console.log("moving");

        onMove(e);
      });
      wrapper.addEventListener("mouseleave", onLeave);
    });
  }

  function getAllSizesByColor(color) {
    if (!variantData[color]) return [];
    // console.log(variantData);
    const sizes = variantData[color].map((variant) => {
      const results = { size: variant.options[1], available: variant.available };
      return results;
    });
    return sizes;
  }

  function renderSizeOptions(sizes) {
    const wrap = document.querySelector(".variant-size");
    if (!wrap) return;

    // reset selected size text
    const selectedSize = document.getElementById("option-value-size");
    selectedSize.textContent = "";

    // 1) remove old sizes
    wrap.innerHTML = "";

    const map = new Map();
    sizes.forEach(({ size, available }) => {
      map.set(size, map.has(size) ? map.get(size) || available : available);
    });

    [...map.entries()].forEach(([size, available]) => {
      const el = document.createElement("div");
      el.className = "title-size" + (available ? "" : " not-available");
      el.dataset.size = size;
      el.dataset.optionValue = size;
      el.textContent = size;
      wrap.appendChild(el);
    });
    selectedSizeHandler();
    inputVariant.value = "";
    inputVariant.dispatchEvent(new Event("change", { bubbles: true }));
    inputVariant.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // color selection
  if (colorContainer) {
    const selectedColor = this.getElementById("option-value-color");
    const colorBtn = colorContainer.querySelector(".variant-image-container-color");
    if (!colorBtn) return;
    const images = colorContainer.querySelectorAll(".variant-image");
    images.forEach((img) => {
      img.addEventListener("click", (e) => {
        const variantId = img.getAttribute("data_id");
        const optionValue = img.getAttribute("data_option_value");
        const allSizes = getAllSizesByColor(optionValue);

        renderSizeOptions(allSizes);
        setGalleryByVariantId(variantId);

        e.stopPropagation();
        images.forEach((i) => i.classList.remove("active"));
        img.classList.add("active");
        selectedColor.textContent = `${optionValue}`;

        // inputVariant.value = "";
      });
    });
  }
  // size selection
  function selectedSizeHandler() {
    if (sizeContainer) {
      const sizeBtn = sizeContainer.querySelectorAll(".title-size");
      const selectedSize = document.getElementById("option-value-size");

      if (!sizeBtn) return;
      sizeBtn.forEach((size) => {
        size.addEventListener("click", (e) => {
          // console.log("clicked");
          e.stopPropagation();
          sizeBtn.forEach((i) => i.classList.remove("active"));
          size.classList.add("active");
          selectedSize.style.display = "block";
          selectedSize.textContent = `${size.textContent}`;
          setInputValue();
        });
      });
    }
  }
  selectedSizeHandler();

  // PRODUCT GALLERY
  let currentIndex = 0;

  function scrollToIndex(index) {
    if (!wrappers[index]) return;

    const slide = wrappers[index];
    // DOt active class
    const dot = dots[index];
    if (dot) {
      dots.forEach((s) => s.classList.remove("active"));
      dot.classList.add("active");
    }
    // side media active class
    if (sideMediaContainer) {
      const allSides = sideMediaContainer.querySelectorAll(".product-media");
      allSides.forEach((item) => item.classList.remove("active"));
      const sideToActivate = allSides[index];
      sideToActivate.classList.add("active");
      ensureThumbVisible(sideToActivate, sideMediaContainer);
    }

    // center the slide
    const left = slide.offsetLeft - mainMedia.clientWidth / 2 + slide.clientWidth / 2;
    mainMedia.scrollTo({
      left,
      behavior: "smooth",
    });
  }

  function ensureThumbVisible(thumb, container) {
    const thumbRect = thumb.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const isVisible =
      thumbRect.top >= containerRect.top && thumbRect.bottom <= containerRect.bottom;

    if (!isVisible) {
      thumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }

  function clickDotHandler(e) {
    const dot = e.currentTarget;
    const index = parseInt(dot.getAttribute("data-index"), 10);
    currentIndex = index;
    scrollToIndex(index);
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", clickDotHandler);
  });

  if (sideMediaContainer) {
    // First media active on load
    const firstSide = sideMediaContainer.querySelector(".product-media");
    firstSide.classList.add("active");
    const allSides = this.querySelectorAll(".product-media");
    allSides.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.stopPropagation();

        allSides.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        const index = Array.from(allSides).indexOf(item);
        currentIndex = index;
        scrollToIndex(index);
      });
    });
  }

  // ARROW SCROLL
  if (productMediaContainer) {
    // init first Dot as active
    const firstDot = dotsContainer.querySelector(".dot");
    firstDot.classList.add("active");

    const leftArrow = productMediaContainer.querySelector(".gallery-left-arrow");
    const rightArrow = productMediaContainer.querySelector(".gallery-right-arrow");
    leftArrow?.addEventListener("click", function (e) {
      e.stopPropagation();

      // console.log("left clicked");
      currentIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
      scrollToIndex(currentIndex);
    });
    rightArrow?.addEventListener("click", function (e) {
      e.stopPropagation();

      // console.log("right clicked");
      currentIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
      scrollToIndex(currentIndex);
    });
  }
  // Enable Disable Add to cart button based on variant availability
  const cartForm = document.getElementById("js-add-to-cart");
  let variantInputSelect = cartForm.querySelector('input[name="id"]');
  const updateAddToCartState = () => {
    const addToCartBtn = cartForm.querySelector("button[data-action='add-to-cart']");
    // console.log(variantInputSelect);
    variantInputSelect = cartForm.querySelector('input[name="id"]');

    if (!addToCartBtn || !variantInputSelect) return;

    const selectedVariant = productData.variants.find(
      (variant) => variant.id.toString() === variantInputSelect.value,
    );
    if (selectedVariant && selectedVariant.available) {
      addToCartBtn.removeAttribute("disabled");
      addToCartBtn.setAttribute("aria-disabled", "false");
    } else {
      addToCartBtn.setAttribute("disabled", "disabled");
      addToCartBtn.setAttribute("aria-disabled", "true");
    }
  };
  // Initial state
  // updateAddToCartState();
  // On variant change
  variantInputSelect.addEventListener("input", (e) => {
    console.log(e.target.value);
    updateAddToCartState();
  });
});
