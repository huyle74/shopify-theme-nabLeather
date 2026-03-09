document.addEventListener("DOMContentLoaded", function () {
  const variants = document.querySelector(".variants-container");
  const colorContainer = variants?.querySelector(".color-size-variant-container") || null;
  const sizeContainer = variants?.querySelector(".variant-size") || null;
  const inputVariant = document.querySelector('input[name="id"]');
  const cartButton = document.querySelector("button[data-action='add-to-cart']");
  const isMobileScreen = window.matchMedia("(max-width: 768px)").matches;

  // CHECK IF ONLY COLOR OR SIZE EXISTS
  const have2Options = document.getElementById("2-variant-existed") || null;
  const doNotHaveOption = document.getElementById("do-not-have-variant") || null;
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
      // console.log(data);
      variantsGallery.push({ color: optionsData, gallery: data });
    });

    const imageContainer = colorContainer.querySelectorAll(".variant-image-container-color");
    imageContainer.forEach((container) => {
      const image = container.querySelector("img");
      const skeleton = container.querySelector(".skeleton");

      if (!image || !skeleton) return;
      if (image.complete && image.naturalHeight !== 0) {
        image.style.width = "100%";
        image.style.height = "100%";
        skeleton.remove();
        return;
      }
      image.addEventListener("load", () => {
        image.style.width = "100%";
        image.style.height = "100%";
        skeleton.remove();
      });

      image.addEventListener("error", () => {
        image.style.width = "100%";
        image.style.height = "100%";
        // Optional: remove skeleton even if image fails
        skeleton.remove();
      });
    });
  }
  // console.log(variantsGallery);

  // Set sticky height for product media container
  const productMediaInfoContainer = document.querySelector(".product-gallery-container");
  if (!isMobileScreen && productMediaInfoContainer) {
    const announcementBar = document.getElementById("shopify-section-announcement");
    const header = document.getElementById("shopify-section-header");
    const totalHeight = announcementBar.offsetHeight + header.offsetHeight;
    productMediaInfoContainer.style.top = totalHeight + "px";
  }

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
  const sideMediaContainer = document.querySelector(".side-product-media-container");

  // Sold out badge functions
  function soldOutBadgeHandler(variant) {
    const soldOutBadge = document.getElementById("sold-out-badge_wrapper");
    if (!soldOutBadge) return;
    if (variant && variant.available === false) {
      soldOutBadge.style.opacity = "1";
      soldOutBadge.style.zIndex = "12";
      return;
    }
    soldOutBadge.style.opacity = "0";
    soldOutBadge.style.zIndex = "-1";
  }

  // Button label update on variant change
  const cartForm = document.getElementById("js-add-to-cart");
  const addToCartBtn = cartForm.querySelector("button[data-action='add-to-cart']");
  function updateButtonLabel(label) {
    const have2Options = document.getElementById("2-variant-existed") || null;
    const oneOptionOnly = document.getElementById("one-option-only") || null;
    const mobileFloatingCart = document.getElementById("mobile-floating-cart");
    const mobileCartBtn = mobileFloatingCart.querySelector("button");

    if (have2Options) {
      // console.log("2 options");
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

  // Set input value based on selected options
  let initRemoveDisableCartButton = false;
  function setInputValue() {
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

    // Change Price when variant changes
    const priceEls = document.querySelectorAll(".current-price");
    const rawPrice = variantId.price; // usually something like 1000 for $10.00
    const format = window.ShopifyConfig?.moneyWithCurrencyFormat || "";
    let currency;
    if (format.includes("<span")) {
      const match = format.match(/([A-Z]{3})<\/span>/);
      currency = match ? match[1] : null;
    }

    if (!currency) {
      currency = format.slice(-3);
    }
    const newPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(rawPrice / 100);

    if (priceEls) {
      if (isMobileScreen) {
        priceEls[0].textContent = newPrice;
      } else {
        priceEls[1].textContent = newPrice;
      }
    }
    // init Remove disable and label cart button if only 2 options or 1 option are available
    if (!initRemoveDisableCartButton && variantId && variantId.available) {
      const cartButton = document.querySelector("button[data-action='add-to-cart']");

      if (cartButton) {
        cartButton.removeAttribute("disabled");
        cartButton.setAttribute("aria-disabled", "false");
        updateButtonLabel("Add to Cart");
      }
      initRemoveDisableCartButton = true;
    }
  }
  setInputValue();

  // DOM Manipulation for size and color selection
  const productMediaContainer = document.querySelector(".product-gallery-info-container");
  const mainMedia = document.getElementById("product-media-container-for-scroll");
  const slides = mainMedia.querySelectorAll(".product-media");
  const dotsContainer = document.querySelector(".dots-container");

  // ZOOM FUNCTIONALITY
  function zoomFunctionality() {
    if (isMobileScreen) return;
    const mainMedia = document.getElementById("product-media-container-for-scroll");
    if (!mainMedia) return;
    const wrappers = mainMedia.querySelectorAll(".product-media-wrapper");
    wrappers.forEach((wrapper) => {
      let clicked = false;
      const slide = wrapper.querySelector(".product-media");
      // wrapper.addEventListener("pointerdown", (e) => e.stopPropagation());

      slide.addEventListener("click", (e) => {
        // e.stopPropagation();

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

  function scrollToIndex(index, behavior = "smooth") {
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
    const sideMediaContainer = document.querySelector(".side-product-media-container");
    // side media active class
    if (sideMediaContainer) {
      const allSides = sideMediaContainer.querySelectorAll(".product-media");
      allSides.forEach((item) => item.classList.remove("active"));
      const sideToActivate = allSides[index];
      sideToActivate.classList.add("active");
      ensureThumbVisible(sideToActivate, sideMediaContainer);
    }

    const mainMedia = document.getElementById("product-media-container-for-scroll");

    // center the slide
    const left = slide.offsetLeft - mainMedia.clientWidth / 2 + slide.clientWidth / 2;
    mainMedia.scrollTo({
      left,
      behavior,
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

  function swipeLeftRight() {
    if (!isMobileScreen) return;

    const swipeArea = document.getElementById("product-media-container-for-scroll");
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let dx = 0;
    let dy = 0;
    let mode = null; // "h" | "v" | null

    swipeArea.addEventListener(
      "touchstart",
      (e) => {
        // Ignore multi-touch (pinch-zoom)
        if (e.touches.length > 1) {
          mode = "ignore";
          return;
        }

        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        dx = 0;
        dy = 0;
        mode = null;
      },
      { passive: true },
    );

    swipeArea.addEventListener(
      "touchmove",
      (e) => {
        // Ignore multi-touch (pinch-zoom)
        if (e.touches.length > 1 || mode === "ignore") {
          return;
        }

        const t = e.touches[0];
        dx = t.clientX - startX;
        dy = t.clientY - startY;

        // Decide direction once (small deadzone to avoid jitter)
        if (mode === null) {
          const deadzone = 10;
          if (Math.abs(dx) < deadzone && Math.abs(dy) < deadzone) return;
          mode = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
        }

        // Only prevent default for horizontal swipes
        if (mode === "h") {
          e.preventDefault();
        }
      },
      { passive: false },
    );

    swipeArea.addEventListener(
      "touchend",
      (e) => {
        // Only handle swipe if it was a horizontal gesture
        if (mode !== "h") return;

        const t = e.changedTouches[0];
        endX = t.clientX;
        endY = t.clientY;

        handleSwipe();
      },
      { passive: true },
    );

    function handleSwipe() {
      const swipeThreshold = 50;

      const dx = endX - startX;

      // If not enough horizontal movement, ignore
      if (Math.abs(dx) < swipeThreshold) return;

      const mainMedia = document.getElementById("product-media-container-for-scroll");
      const slides = mainMedia.querySelectorAll(".product-media");

      if (dx > 0) {
        // Swipe right
        currentIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
      } else {
        // Swipe left
        currentIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
      }

      scrollToIndex(currentIndex);
    }
  }

  swipeLeftRight();

  // review star Scroll
  // review star Scroll
  (() => {
    const reviewStarBlock = document.querySelectorAll(".review-star");
    const reviewSection = document.getElementById("looxReviews");
    if (!reviewStarBlock || !reviewSection) return;

    const lastReviewStar = reviewStarBlock[reviewStarBlock.length - 1];
    const firstReviewStar = reviewStarBlock[0];

    const handleScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // ✅ Add 150ms delay before scrolling
      setTimeout(() => {
        reviewSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    };

    if (isMobileScreen) {
      firstReviewStar.addEventListener("touchend", handleScroll, { passive: false });
    } else {
      lastReviewStar.addEventListener("click", handleScroll);
    }
  })();

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
    const firstTitleSize = wrap.querySelector(".title-size:not(.not-available)");
    firstTitleSize.classList.add("active");
    selectedSizeHandler();
    inputVariant.value = "";
    inputVariant.dispatchEvent(new Event("change", { bubbles: true }));
    inputVariant.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function sortByIdFirst(gallery, targetId) {
    const index = gallery.findIndex((item) => item.id === targetId);
    if (index === -1) {
      return gallery;
    }
    return [gallery[index], ...gallery.slice(0, index), ...gallery.slice(index + 1)];
  }
  function renderGalleryByColor(color, mediaId) {
    if (variantsGallery.length === 0) return;
    const selectedId = parseInt(mediaId, 10);

    const variant = variantsGallery.find((v) => v.color === color);
    if (!variant) return;

    const gallery = sortByIdFirst(variant.gallery, selectedId);
    // console.log(gallery, mediaId);

    const sideMediaContainer = document.querySelector(".side-product-media-container");
    const mainMedia = document.getElementById("product-media-container-for-scroll");
    if (!sideMediaContainer || !mainMedia) return;
    const mainMediaContainer = mainMedia.querySelector(".product-media-container");
    const dotsContainer = document.getElementById("all-dots");

    mainMediaContainer.innerHTML = "";
    sideMediaContainer.innerHTML = "";
    dotsContainer.innerHTML = "";

    gallery.forEach((media, index) => {
      // Main media
      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = "product-media-wrapper";
      const mainMediaImg = document.createElement("img");

      mainMediaImg.src = media.src;
      mainMediaImg.loading = "eager";
      mainMediaImg.className = "product-media";
      mainMediaImg.alt = media.alt || productData.title;
      mainMediaImg.dataset.index = index;
      mainMediaImg.dataset.mediaId = media.id;
      mainMediaImg.height = 900;
      mainMediaImg.width = 900;
      wrapperDiv.appendChild(mainMediaImg);
      mainMediaContainer.scrollLeft = 0;
      mainMediaContainer.appendChild(wrapperDiv);

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
      const src = media.src.replace(/([?&](height|width)=)900/g, `$1${128}`);
      imageEl.src = src;
      imageEl.loading = "eager";
      imageEl.alt = media.alt || productData.title;
      imageEl.height = 128;
      imageEl.width = 128;
      mediaDiv.appendChild(imageEl);
      sideMediaContainer.appendChild(mediaDiv);

      // DOTS
      const dotDiv = document.createElement("div");
      dotDiv.className = "dot";
      dotDiv.dataset.index = index;
      dotsContainer.appendChild(dotDiv);
    });

    resetDots();
    selectSideMedia();
    zoomFunctionality();
    dotClicked();
    setTimeout(() => {
      scrollToIndex(0, "instant");
    }, 20);
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

        // e.stopPropagation();
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
          // e.stopPropagation();
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
    // console.log("Dot clicked", index);
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
        // e.stopPropagation();

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

    const mainMedia = document.getElementById("product-media-container-for-scroll");

    const leftArrow = productMediaContainer.querySelector(".gallery-left-arrow");
    const rightArrow = productMediaContainer.querySelector(".gallery-right-arrow");
    leftArrow?.addEventListener("click", function (e) {
      // e.stopPropagation();
      const slides = mainMedia.querySelectorAll(".product-media");

      currentIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
      scrollToIndex(currentIndex);
    });
    rightArrow?.addEventListener("click", function (e) {
      // e.stopPropagation();
      const slides = mainMedia.querySelectorAll(".product-media");

      currentIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
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
  const updateAddToCartState = () => {
    const addToCartBtn = cartForm.querySelector("button[data-action='add-to-cart']");
    const variantInputSelect = cartForm.querySelector('input[name="id"]');
    const have2Options = document.getElementById("2-variant-existed") || null;
    const oneOptionOnly = document.getElementById("one-option-only") || null;

    if (!addToCartBtn || !variantInputSelect) return;

    const selectedVariant = productData.variants.find(
      (variant) => variant.id.toString() === variantInputSelect.value,
    );

    // Mobile floating cart button
    if (isMobileScreens && selectedVariant && selectedVariant.available) {
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

      // if (have2Options) updateButtonLabel("Select Size");
      // if (oneOptionOnly) updateButtonLabel();
    }
  };
  // Initial state
  // updateAddToCartState();
  // On variant change
  const variantInputSelect = cartForm.querySelector('input[name="id"]');
  variantInputSelect.addEventListener("input", (e) => {
    updateAddToCartState();
  });

  // updateButtonLabel();

  // Mobile function
  // const isMobileScreen = window.matchMedia("(max-width: 768px)").matches;
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

  // Mobile gallery scroll when clicking on main media
  const handlePopupGalleryAndScroll = () => {
    if (!isMobileScreen) return;
    const mainMedia = document.getElementById("product-media-container-for-scroll");
    if (!mainMedia) return;

    // Create dialog once
    const dialogEl = document.createElement("dialog");
    dialogEl.id = "mobile-gallery-dialog";
    dialogEl.className = "mobile-gallery-dialog";

    // Add close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "mobile-gallery-close";
    closeBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`;
    closeBtn.setAttribute("aria-label", "Close gallery");

    // Add counter
    const counter = document.createElement("div");
    counter.className = "mobile-gallery-counter";
    counter.innerHTML = '<span id="mobile-current">1</span> / <span id="mobile-total">0</span>';

    dialogEl.appendChild(closeBtn);
    dialogEl.appendChild(counter);

    // Gallery container
    const galleryContainer = document.createElement("div");
    galleryContainer.className = "mobile-gallery-container";
    dialogEl.appendChild(galleryContainer);

    document.body.appendChild(dialogEl);

    // ===================================
    // PINCH ZOOM VARIABLES
    // ===================================
    let currentScale = 1;
    let lastDistance = 0;
    let isZooming = false;
    let currentImageIndex = 0;
    let translateX = 0;
    let translateY = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;

    // Get current index from main gallery
    const getCurrentIndex = () => {
      const dots = document.querySelectorAll(".dot");
      const activeDot = Array.from(dots).findIndex((dot) => dot.classList.contains("active"));
      return activeDot !== -1 ? activeDot : 0;
    };

    // Update counter
    const updateCounter = (current, total) => {
      const currentEl = dialogEl.querySelector("#mobile-current");
      const totalEl = dialogEl.querySelector("#mobile-total");
      if (currentEl && totalEl) {
        currentEl.textContent = current + 1;
        totalEl.textContent = total;
      }
    };

    // Get current visible image
    const getCurrentImage = () => {
      const images = galleryContainer.querySelectorAll(".mobile-gallery-image");
      return images[currentImageIndex] || null;
    };

    // Reset zoom for an image
    const resetZoom = (image) => {
      if (!image) return;
      currentScale = 1;
      translateX = 0;
      translateY = 0;
      image.style.transform = `translate3d(0, 0, 0) scale(1)`;
      image.style.transition = "transform 0.3s ease";
      setTimeout(() => {
        image.style.transition = "";
      }, 300);
    };

    // Apply transform to image
    const applyTransform = (image, scale, x, y) => {
      if (!image) return;
      image.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    };

    // Calculate distance between two touch points
    const getDistance = (touch1, touch2) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Get center point between two touches
    const getCenter = (touch1, touch2) => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    };
    // ===================================
    // DOUBLE TAP VARIABLES
    // ===================================
    let lastTapTime = 0;
    let tapTimeout = null;
    const DOUBLE_TAP_DELAY = 300; // ms

    // ===================================
    // ZOOM EVENT HANDLERS
    // ===================================
    const handleTouchStart = (e) => {
      const image = getCurrentImage();
      if (!image) return;

      if (e.touches.length === 2) {
        // Pinch zoom start
        e.preventDefault();
        isZooming = true;
        lastDistance = getDistance(e.touches[0], e.touches[1]);

        // Disable container scroll while zooming
        galleryContainer.style.overflowX = "hidden";
      } else if (e.touches.length === 1 && currentScale > 1) {
        // Pan start (only if zoomed in)
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      const image = getCurrentImage();
      if (!image) return;

      if (e.touches.length === 2 && isZooming) {
        // Pinch zoom
        e.preventDefault();

        const distance = getDistance(e.touches[0], e.touches[1]);

        if (lastDistance > 0) {
          const delta = distance - lastDistance;
          const scaleChange = delta * 0.01;

          currentScale += scaleChange;
          currentScale = Math.max(1, Math.min(currentScale, 4)); // Limit between 1x and 4x

          applyTransform(image, currentScale, translateX, translateY);
        }

        lastDistance = distance;
      } else if (e.touches.length === 1 && currentScale > 1) {
        // Pan (move zoomed image)
        e.preventDefault();

        const touch = e.touches[0];
        const deltaX = touch.clientX - lastTouchX;
        const deltaY = touch.clientY - lastTouchY;

        // Calculate max pan distance based on scale
        const maxPanX = (image.offsetWidth * currentScale - image.offsetWidth) / 2;
        const maxPanY = (image.offsetHeight * currentScale - image.offsetHeight) / 2;

        translateX += deltaX;
        translateY += deltaY;

        // Constrain pan within image bounds
        translateX = Math.max(-maxPanX, Math.min(maxPanX, translateX));
        translateY = Math.max(-maxPanY, Math.min(maxPanY, translateY));

        applyTransform(image, currentScale, translateX, translateY);

        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      }
    };

    // ===================================
    // DOUBLE TAP HANDLER
    // ===================================
    const handleDoubleTap = (e) => {
      const image = getCurrentImage();
      if (!image) return;

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;

      // Clear any existing timeout
      clearTimeout(tapTimeout);

      if (tapLength < DOUBLE_TAP_DELAY && tapLength > 0) {
        // Double tap detected
        e.preventDefault();

        if (currentScale > 1) {
          // ✅ Zoomed in -> Reset to original
          resetZoom(image);
        } else {
          // ✅ Not zoomed -> Zoom in to 2x at tap location
          const rect = image.getBoundingClientRect();
          const touchX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
          const touchY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

          // Calculate position relative to image center
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          currentScale = 2;
          translateX = (centerX - touchX) * 0.5;
          translateY = (centerY - touchY) * 0.5;

          image.style.transition = "transform 0.3s ease";
          applyTransform(image, currentScale, translateX, translateY);

          setTimeout(() => {
            image.style.transition = "";
          }, 300);
        }

        lastTapTime = 0; // Reset
      } else {
        // Single tap - wait to see if there's a second tap
        lastTapTime = currentTime;

        tapTimeout = setTimeout(() => {
          // Single tap action (optional)
        }, DOUBLE_TAP_DELAY);
      }
    };

    const handleTouchEnd = (e) => {
      const image = getCurrentImage();
      if (!image) return;

      if (e.changedTouches.length === 1 && !isZooming) {
        handleDoubleTap(e);
      }

      if (e.touches.length < 2) {
        isZooming = false;
        lastDistance = 0;

        // Re-enable container scroll
        galleryContainer.style.overflowX = "auto";

        // Reset zoom if scale is close to 1
        if (currentScale < 1.1) {
          resetZoom(image);
        }
      }
    };

    // Scroll to specific image
    const scrollToImage = (index, immediate = false) => {
      const images = galleryContainer.querySelectorAll(".mobile-gallery-image");
      if (images[index]) {
        const container = galleryContainer;
        const image = images[index];
        const scrollLeft = image.offsetLeft - container.clientWidth / 2 + image.clientWidth / 2;

        // Reset zoom on previous image when switching
        if (currentImageIndex !== index) {
          const prevImage = images[currentImageIndex];
          if (prevImage) resetZoom(prevImage);
          currentImageIndex = index;
        }

        if (immediate) {
          container.scrollLeft = scrollLeft;
        } else {
          container.scrollTo({
            left: scrollLeft,
            behavior: "smooth",
          });
        }

        updateCounter(index, images.length);
      }
    };

    // Track scroll position to update counter
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const container = galleryContainer;
        const scrollLeft = container.scrollLeft;
        const imageWidth = container.clientWidth;
        const newIndex = Math.round(scrollLeft / imageWidth);
        const totalImages = container.querySelectorAll(".mobile-gallery-image").length;

        // Reset zoom when changing images
        if (newIndex !== currentImageIndex) {
          const images = galleryContainer.querySelectorAll(".mobile-gallery-image");
          const prevImage = images[currentImageIndex];
          if (prevImage) resetZoom(prevImage);
          currentImageIndex = newIndex;
        }

        updateCounter(newIndex, totalImages);
      }, 100);
    };

    const closeDialog = () => {
      // Reset all zoom states
      const images = galleryContainer.querySelectorAll(".mobile-gallery-image");
      images.forEach((img) => resetZoom(img));

      currentScale = 1;
      translateX = 0;
      translateY = 0;
      currentImageIndex = 0;

      dialogEl.close();
      document.body.style.overflow = "";
      galleryContainer.removeEventListener("scroll", handleScroll);
    };

    // Open dialog when clicking main media
    mainMedia.addEventListener("click", function (e) {
      if (e.target.closest(".arrow") || e.target.closest(".dot")) return;

      const allImages = document.querySelectorAll(
        "#product-media-container-for-scroll .product-media",
      );

      if (allImages.length === 0) return;

      const currentIndex = getCurrentIndex();
      currentImageIndex = currentIndex;

      // Populate dialog with images
      galleryContainer.innerHTML = "";

      allImages.forEach((img, index) => {
        const imgClone = img.cloneNode(true);
        imgClone.className = "mobile-gallery-image";
        imgClone.dataset.index = index;

        // ✅ Add touch event listeners for zoom
        imgClone.addEventListener("touchstart", handleTouchStart, { passive: false });
        imgClone.addEventListener("touchmove", handleTouchMove, { passive: false });
        imgClone.addEventListener("touchend", handleTouchEnd, { passive: false });

        galleryContainer.appendChild(imgClone);
      });

      updateCounter(currentIndex, allImages.length);

      dialogEl.showModal();
      document.body.style.overflow = "hidden";

      scrollToImage(currentIndex, true);

      // Add scroll listener
      galleryContainer.addEventListener("scroll", handleScroll, { passive: true });

      // Close on empty space click (only if not zoomed)
      galleryContainer.addEventListener("click", (e) => {
        if (currentScale <= 1) {
          if (e.target.tagName !== "IMG" && !e.target.closest(".mobile-gallery-image")) {
            closeDialog();
          }
        }
      });
    });

    // Close button handler
    closeBtn.addEventListener("click", () => {
      closeDialog();
    });

    // Close on backdrop click
    dialogEl.addEventListener("click", (event) => {
      if (event.target === dialogEl && currentScale <= 1) {
        closeDialog();
      }
    });

    // Close on ESC
    dialogEl.addEventListener("cancel", () => {
      closeDialog();
    });
  };

  handlePopupGalleryAndScroll();

  // Recommend PRODUCT
  (async () => {
    const section = document.querySelector('[data-section-type="product-recommendations"]');
    const settings = JSON.parse(section.getAttribute("data-section-settings"));

    const recommendUrlApi = ""
      .concat(window.routes.productRecommendationsUrl, "?section_id=")
      .concat(section.getAttribute("data-section-id"), "&product_id=")
      .concat(settings["productId"], "&limit=")
      .concat(settings["recommendationsCount"], "&intent=related");
    try {
      const response = await fetch(recommendUrlApi);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const content = await response.text();
      const container = document.createElement("div");
      container.innerHTML = content;
      // Get the elements
      const newContent = container.querySelector(".ProductRecommendations");
      const oldContent = section.querySelector(".ProductRecommendations");

      if (newContent && oldContent) {
        oldContent.innerHTML = newContent.innerHTML;

        // Initialize Flickity carousel
        const carousel = oldContent.querySelector("[data-flickity-config]");

        if (carousel) {
          // Check if Flickity is available
          if (typeof Flickity !== "undefined") {
            const flickityOptions = JSON.parse(carousel.getAttribute("data-flickity-config"));
            const flickityInstance = new Flickity(carousel, flickityOptions);

            // Optional: Log carousel info
          } else {
            console.error("❌ Flickity library not loaded");
          }
        }
      }
    } catch (error) {
      console.error("❌ Error loading product recommendations:", error);
    }
  })();

  // Recently viewed products
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  var Carousel = /*#__PURE__*/ (function () {
    function Carousel(element) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var overrideSettings = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      _classCallCheck(this, Carousel);

      this.element = element;
      this.initialConfig = Object.assign(
        JSON.parse(element.getAttribute("data-flickity-config")),
        overrideSettings,
      );
      this.options = options;

      this._attachListeners();

      this._build();
    }

    _createClass(Carousel, [
      {
        key: "destroy",
        value: function destroy() {
          this.flickityInstance.destroy();

          if (this.initialConfig["breakpoints"] !== undefined) {
            document.removeEventListener("breakpoint:changed", this._onBreakpointChangedListener);
          }
        },
      },
      {
        key: "getFlickityInstance",
        value: function getFlickityInstance() {
          return this.flickityInstance;
        },
      },
      {
        key: "selectCell",
        value: function selectCell(index) {
          var shouldPause =
            arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
          var shouldAnimate =
            arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

          if (shouldPause) {
            this.flickityInstance.pausePlayer();
          }

          this.flickityInstance.select(index, false, !shouldAnimate);
        },
      },
      {
        key: "next",
        value: function next() {
          this.flickityInstance.next();
        },
      },
      {
        key: "previous",
        value: function previous() {
          this.flickityInstance.previous();
        },
      },
      {
        key: "pausePlayer",
        value: function pausePlayer() {
          this.flickityInstance.pausePlayer();
        },
      },
      {
        key: "unpausePlayer",
        value: function unpausePlayer() {
          this.flickityInstance.unpausePlayer();
        },
      },
      {
        key: "resize",
        value: function resize() {
          this.flickityInstance.resize();
        },
      },
      {
        key: "getSelectedIndex",
        value: function getSelectedIndex() {
          return this.flickityInstance.selectedIndex;
        },
      },
      {
        key: "getSelectedCell",
        value: function getSelectedCell() {
          return this.flickityInstance.selectedCell.element;
        },
      },
      {
        key: "_attachListeners",
        value: function _attachListeners() {
          if (this.initialConfig["breakpoints"] !== undefined) {
            this._onBreakpointChangedListener = this._onBreakpointChanged.bind(this);
            document.addEventListener("breakpoint:changed", this._onBreakpointChangedListener);
          }
        },
        /**
         * Create the carousel instance
         */
      },
      {
        key: "_build",
        value: function _build() {
          var _this = this;

          var config = this._processConfig();

          this.flickityInstance = new Flickity(this.element, config);

          this._validateDraggable();

          this.selectedIndex = this.flickityInstance.selectedIndex;
          this.flickityInstance.on("resize", this._validateDraggable.bind(this));

          if (this.options["onSelect"]) {
            this.flickityInstance.on("select", function () {
              // Flickity will send the "select" event whenever the window resize (even on mobile...), as a consequence we need to check
              // first if the slide index have changed or not (cf: https://github.com/metafizzy/flickity/issues/529)
              if (_this.selectedIndex !== _this.flickityInstance.selectedIndex) {
                _this.options["onSelect"](
                  _this.flickityInstance.selectedIndex,
                  _this.flickityInstance.selectedCell.element,
                );

                _this.selectedIndex = _this.flickityInstance.selectedIndex;
              }
            });
          }

          if (this.options["onSettle"]) {
            this.flickityInstance.on("settle", function (index) {
              _this.options["onSettle"](index, _this.flickityInstance.selectedCell.element);
            });
          }

          if (this.options["onClick"]) {
            this.flickityInstance.on("staticClick", function (event, pointer, cell, index) {
              _this.options["onClick"](cell, index);
            });
          }
        },
        /**
         * By default, Flickity does not disable draggable automatically if there is nothing to slide. We therefore manually do the check here by checking
         * if the displayed elements equals to the amount of elements
         */
      },
      {
        key: "_validateDraggable",
        value: function _validateDraggable() {
          var isActive = this.flickityInstance.isActive || false;

          if (!isActive || !this.flickityInstance.options["draggable"]) {
            return; // Not draggable, so nothing to do
          }

          if (
            undefined === this.flickityInstance.selectedElements ||
            this.flickityInstance.selectedElements.length === this.flickityInstance.cells.length
          ) {
            this.flickityInstance.unbindDrag();
          } else {
            this.flickityInstance.bindDrag();
          }
        },
        /**
         * Flickity is a CSS driven library and hence it is hard to setup some stuff in pure JS
         */
      },
      {
        key: "_processConfig",
        value: function _processConfig() {
          var config = Object.assign({}, this.initialConfig);
          delete config["breakpoints"];

          if (this.initialConfig["breakpoints"] === undefined) {
            return config; // No change, we simply return the config as it is
          }

          var breakpoints = this.initialConfig["breakpoints"];
          breakpoints.forEach(function (breakpoint) {
            if (Responsive.matchesBreakpoint(breakpoint["matches"])) {
              config = Object.assign(config, breakpoint["settings"]);
            }
          });
          return config;
        },
        /**
         * Verify if the breakpoint has changed, and optionally update the carousel
         */
      },
      {
        key: "_onBreakpointChanged",
        value: function _onBreakpointChanged() {
          // The breakpoint may have changed, so we delete the carousel and rebuild it
          this.flickityInstance.destroy();

          this._build();
        },
      },
    ]);

    return Carousel;
  })();

  (async () => {
    console.log("Hello we here");
    const section = document.querySelector('[data-section-type="recently-viewed-products"]');
    if (!section) return;

    const options = JSON.parse(section.getAttribute("data-section-settings"));
    const items = JSON.parse(localStorage.getItem("recentlyViewedProducts") || "[]");
    if (items.includes(options["productId"])) {
      items.splice(items.indexOf(options["productId"]), 1);
    }
    const queryString = items
      .map((item) => {
        return "id:".concat(item);
      })
      .join(" OR ");

    const url = ""
      .concat(window.routes.searchUrl, "?section_id=")
      .concat(section.getAttribute("data-section-id"), "&type=product&q=")
      .concat(queryString);

    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error("HTTP error! status: ".concat(response.status));
      }
      const content = await response.text();
      const tempElement = document.createElement("div");
      tempElement.innerHTML = content;
      const newSection = tempElement.querySelector(".Section");

      if (!newSection || !newSection.innerHTML.trim()) {
        section.parentNode.style.display = "none";
        return;
      }
      section.innerHTML = newSection.innerHTML;
      section.parentNode.style.display = "block";

      const carouselElement = section.querySelector("[data-flickity-config]");
      if (!carouselElement) return;

      try {
        if (typeof Carousel !== "undefined") {
          section.carousel = new Carousel(carouselElement);
        } else if (typeof Flickity !== "undefined") {
          const config = JSON.parse(carouselElement.getAttribute("data-flickity-config"));
          section.carousel = new Flickity(carouselElement, config);
        }
      } catch (err) {
        console.error("Carousel error:", err);
      }
    } catch (error) {
      // throw new Error("❌ Error loading recently viewed products:", error);
    }
  })();
});
