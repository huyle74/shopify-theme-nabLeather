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

  // get variant gallery data
  let variantsGallery = [];
  if (colorContainer) {
    const colorImages = colorContainer.querySelectorAll(".variant-image");
    colorImages.forEach((img) => {
      const variantGalleryData = img.getAttribute("data_variant_gallery");
      const optionsData = img.getAttribute("data_option_value");
      const data = variantGalleryData ? JSON.parse(variantGalleryData) : [];
      if (!data || data.length === 0) return;
      variantsGallery.push({ color: optionsData, gallery: data });
    });
  }
  // console.log(variantsGallery);

  // Add active class to first color and size option by default
  // DATA variant mapping
  const productJsonEl = document.querySelector('[id^="ProductJson-"]');
  if (!productJsonEl) return;
  const productData = JSON.parse(productJsonEl.textContent);

  if (!productData.available) {
    cartButton.setAttribute("disabled", "disabled");
    cartButton.setAttribute("aria-disabled", "true");
    cartButton.textContent = "Sold Out";
  }

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

  // Sold out badge functions
  function soldOutBadgeHandler(variant) {
    const soldOutBadge = document.querySelector(".sold-out-badge");
    if (!soldOutBadge) return;
    if (variant && variant.available === false) {
      soldOutBadge.style.opacity = "1";
      return;
    }
    soldOutBadge.style.opacity = "0";
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
      if (!colorValue || !sizeValue) {
        soldOutBadgeHandler(null);
        return null;
      }
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
    // ADD SOLD OUT BADGE
    soldOutBadgeHandler(variantId);

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

  // ZOOM FUNCTIONALITY
  function zoomFunctionality() {
    const mainMedia = document.getElementById("product-media-container-for-scroll");
    if (!mainMedia) return;
    const wrappers = mainMedia.querySelectorAll(".product-media-wrapper");
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
        onMove(e);
      });
      wrapper.addEventListener("mouseleave", onLeave);
    });
  }
  zoomFunctionality();

  let currentIndex = 0;

  function scrollToIndex(index) {
    const wrappers = document.querySelectorAll(".product-media-wrapper");
    if (!wrappers[index]) return;

    const slide = wrappers[index];
    // DOt active class
    const dots = dotsContainer.querySelectorAll(".dot");
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

  function resetDots() {
    const dots = dotsContainer.querySelectorAll(".dot");
    dots.forEach((dot) => {
      dot.classList.remove("active");
    });
    const firstDot = dotsContainer.querySelector(".dot");
    firstDot.classList.add("active");
    currentIndex = 0;
  }

  // Render size options based on color selection
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

  function renderGalleryByColor(color, mediaId) {
    if (variantsGallery.length === 0) return;
    const selectedId = parseInt(mediaId, 10);

    const variant = variantsGallery.find((v) => v.color === color);
    if (!variant) return;
    const gallery = variant.gallery.sort((a, b) => {
      if (a.id === selectedId) return -1;
      if (b.id === selectedId) return 1;
      return 0;
    });

    const sideMediaContainer = document.querySelector(".side-product-media-container");
    const mainMedia = document.getElementById("product-media-container-for-scroll");
    if (!sideMediaContainer || !mainMedia) return;
    const mainMediaContainer = mainMedia.querySelector(".product-media-container");
    const dotsContainer = document.getElementById("all-dots");

    mainMediaContainer.innerHTML = "";
    sideMediaContainer.innerHTML = "";
    dotsContainer.innerHTML = "";

    gallery.forEach((media, index) => {
      // Side media
      const mediaDiv = document.createElement("div");
      mediaDiv.className = "product-media";
      mediaDiv.dataset.index = index;
      mediaDiv.dataset.mediaId = media.id;
      mediaDiv.dataset.variantId = productData.variants
        .filter((v) => v.options[0] === color)
        .map((v) => v.id)
        .join(", ");
      const imageEl = document.createElement("img");
      imageEl.src = media.src;
      mediaDiv.appendChild(imageEl);
      sideMediaContainer.appendChild(mediaDiv);

      // Main media
      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = "product-media-wrapper";
      const mainMediaImg = document.createElement("img");

      mainMediaImg.src = media.src;
      mainMediaImg.className = "product-media";
      mainMediaImg.alt = media.alt || productData.title;
      mainMediaImg.dataset.index = index;
      mainMediaImg.dataset.mediaId = media.id;
      mainMediaImg.dataset.variantId = productData.variants;
      mainMediaImg.height = 1600;
      mainMediaImg.width = 1600;
      mainMediaImg.dataset.variantId = productData.variants
        .filter((v) => v.options[0] === color)
        .map((v) => v.id)
        .join(", ");
      mainMediaImg.loading = "lazy";
      wrapperDiv.appendChild(mainMediaImg);
      mainMediaContainer.appendChild(wrapperDiv);

      // DOTS
      const dotDiv = document.createElement("div");
      dotDiv.className = "dot";
      dotDiv.dataset.index = index;
      dotsContainer.appendChild(dotDiv);
    });
    resetDots();
    // scrollToIndex(0);
    selectSideMedia();
    zoomFunctionality();
    dotClicked();
  }

  // color selection
  function selectColor() {
    if (!colorContainer) return;

    const selectedColor = document.getElementById("option-value-color");
    const colorBtn = colorContainer.querySelector(".variant-image-container-color");
    if (!colorBtn) return;
    const images = colorContainer.querySelectorAll(".variant-image");
    images.forEach((img) => {
      img.addEventListener("click", (e) => {
        if (img.classList.contains("active")) return;

        const optionValue = img.getAttribute("data_option_value");
        const imageId = img.getAttribute("data_media_id");
        const allSizes = getAllSizesByColor(optionValue);
        renderGalleryByColor(optionValue, imageId);
        renderSizeOptions(allSizes);

        e.stopPropagation();
        images.forEach((i) => i.classList.remove("active"));
        img.classList.add("active");
        selectedColor.textContent = `${optionValue}`;

        if (variantsGallery.length == 0) {
          const allSideMedias = sideMediaContainer.querySelectorAll(".product-media");
          const imgUrl = img.src;

          const index = Array.from(allSideMedias).findIndex((item) => {
            const itemUrl = item.src || item.querySelector("img").src;
            return String(itemUrl) === String(imgUrl);
          });
          scrollToIndex(index);
        }
        setInputValue();
      });
    });
  }
  selectColor();

  // size selection
  function selectedSizeHandler() {
    if (sizeContainer) {
      const sizeBtn = sizeContainer.querySelectorAll(".title-size");
      const selectedSize = document.getElementById("option-value-size");

      if (!sizeBtn) return;
      sizeBtn.forEach((size) => {
        size.addEventListener("click", (e) => {
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
    console.log("Dot clicked", index);
    scrollToIndex(index);
  }

  function dotClicked() {
    const dots = dotsContainer.querySelectorAll(".dot");
    dots.forEach((dot) => {
      dot.addEventListener("click", clickDotHandler);
    });
  }
  dotClicked();

  // SIDE MEDIA CLICK
  function selectSideMedia() {
    const sideMediaContainer = document.querySelector(".side-product-media-container");
    if (!sideMediaContainer) return;

    // First media active on load
    const firstSide = sideMediaContainer.querySelector(".product-media");
    firstSide.classList.add("active");
    const allSides = sideMediaContainer.querySelectorAll(".product-media");
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
  selectSideMedia();

  // ARROW SCROLL
  if (productMediaContainer) {
    // init first Dot as active
    const firstDot = dotsContainer.querySelector(".dot");
    firstDot.classList.add("active");

    const leftArrow = productMediaContainer.querySelector(".gallery-left-arrow");
    const rightArrow = productMediaContainer.querySelector(".gallery-right-arrow");
    leftArrow?.addEventListener("click", function (e) {
      e.stopPropagation();

      currentIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
      // console.log("left Arrow", currentIndex );
      scrollToIndex(currentIndex);
    });
    rightArrow?.addEventListener("click", function (e) {
      e.stopPropagation();

      currentIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
      // console.log('Right Arrow', currentIndex);
      scrollToIndex(currentIndex);
    });
  }
  // Render float mobile cart button title
  const isMobileScreens = window.matchMedia("(max-width: 768px)").matches;
  const mobileFloatingCarts = document.getElementById("mobile-floating-cart");
  const mobileCartBtn = mobileFloatingCarts.querySelector("button");
  const mobileCartImg = mobileFloatingCarts.querySelector("img");
  const mobileCartTitle = mobileFloatingCarts.querySelector("span");
  const mobileBtnOverlay = document.getElementById("float-cart__overlay-button");
  if (isMobileScreens) {
    mobileCartTitle.textContent =
      productData.title.length > 65 ? productData.title.slice(0, 65) + "..." : productData.title;
  }

  // Enable Disable Add to cart button based on variant availability
  const cartForm = document.getElementById("js-add-to-cart");
  let variantInputSelect = cartForm.querySelector('input[name="id"]');
  const updateAddToCartState = () => {
    const addToCartBtn = cartForm.querySelector("button[data-action='add-to-cart']");
    variantInputSelect = cartForm.querySelector('input[name="id"]');
    // console.log(variantInputSelect.value);
    const have2Options = document.getElementById("2-variant-existed") || null;
    const oneOptionOnly = document.getElementById("one-option-only") || null;

    if (!addToCartBtn || !variantInputSelect) return;

    const selectedVariant = productData.variants.find(
      (variant) => variant.id.toString() === variantInputSelect.value,
    );

    // Mobile floating cart button

    if (isMobileScreens && selectedVariant.available) {
      mobileCartImg.src = selectedVariant.featured_image
        ? selectedVariant.featured_image.src
        : productData.images[0];
      mobileCartBtn.style.color = "white";
      mobileBtnOverlay.style.display = "none";
    } else {
      mobileCartBtn.style.color = "black";
      mobileBtnOverlay.style.display = "block";
    }

    if (selectedVariant && selectedVariant.available) {
      addToCartBtn.removeAttribute("disabled");
      addToCartBtn.setAttribute("aria-disabled", "false");
      mobileCartBtn.removeAttribute("disabled");
      mobileCartBtn.setAttribute("aria-disabled", "false");
      updateButtonLabel("Add to Cart");
    } else {
      addToCartBtn.setAttribute("disabled", "disabled");
      addToCartBtn.setAttribute("aria-disabled", "true");
      mobileCartBtn.setAttribute("disabled", "disabled");
      mobileCartBtn.setAttribute("aria-disabled", "true");

      if (have2Options) updateButtonLabel("Select Size");
      if (oneOptionOnly) {
        updateButtonLabel();
      }
    }
  };
  // Initial state
  // updateAddToCartState();
  // On variant change
  variantInputSelect.addEventListener("input", (e) => {
    // console.log(e.target.value);
    updateAddToCartState();
  });

  // Button label update on variant change
  const addToCartBtn = cartForm.querySelector("button[data-action='add-to-cart']");
  function updateButtonLabel(label) {
    const have2Options = document.getElementById("2-variant-existed") || null;
    const oneOptionOnly = document.getElementById("one-option-only") || null;
    const mobileFloatingCart = document.getElementById("mobile-floating-cart");
    const mobileCartBtn = mobileFloatingCart.querySelector("button");

    if (have2Options) {
      addToCartBtn.textContent = label || "Select Size";
      mobileCartBtn.textContent = label || "Select Size";
    }

    if (oneOptionOnly) {
      const optionType = document.getElementById("option-value-color") ? "Color" : "Size";
      addToCartBtn.textContent = label || `Select ${optionType}`;
      mobileCartBtn.textContent = label || `Select ${optionType}`;
    }

    if (!productData.available) {
      addToCartBtn.textContent = "Sold Out";
      return;
    }
  }
  updateButtonLabel();

  // Mobile function
  const isMobileScreen = window.matchMedia("(max-width: 768px)").matches;
  const productPageContainer = document.querySelector(".product-gallery-info-container");
  const mobileFloatingCart = document.getElementById("mobile-floating-cart");
  const productFormEl = document.querySelector(".product-gallery-container");

  // track visibility state
  let isProductFormVisible = false;
  let isAddToCartBtnVisible = false;

  function updateFloatingCart() {
    // 🔥 trigger only when BOTH are out of view
    if (!isMobileScreen || !productData.available) return;

    if (!isProductFormVisible && !isAddToCartBtnVisible) {
      mobileFloatingCart.style.transform = "translateY(0)";
    } else {
      mobileFloatingCart.style.transform = "translateY(300%)";
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.target === productFormEl) {
          isProductFormVisible = entry.isIntersecting;
        }
        if (entry.target === addToCartBtn) {
          isAddToCartBtnVisible = entry.isIntersecting;
        }
      });

      updateFloatingCart();
    },
    {
      root: null,
      threshold: 0,
    },
  );
  observer.observe(productFormEl);
  observer.observe(addToCartBtn);

  // scroll to size section on mobile floating cart click
  if (isMobileScreen) {
    mobileBtnOverlay.addEventListener("click", function () {
      const variantContainer = document.querySelector(".variants-container");

      if (variantContainer) {
        variantContainer.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
});
