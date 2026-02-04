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
    // Change Price when variant changes
    const priceEls = document.querySelectorAll(".current-price");
    const rawPrice = variantId.price; // usually something like 1000 for $10.00
    const currency = window.ShopifyConfig?.moneyWithCurrencyFormat.slice(-3);
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

      console.log(window.ShopifyConfig);
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
  const productMediaContainer = document.querySelector(".product-gallery-info-container");
  const mainMedia = document.getElementById("product-media-container-for-scroll");
  const slides = mainMedia.querySelectorAll(".product-media");
  const dotsContainer = document.querySelector(".dots-container");

  // ZOOM FUNCTIONALITY
  function zoomFunctionality() {
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

  function swipeLeftRight() {
    if (!isMobileScreen) return;

    const swipeArea = document.getElementById("product-media-container-for-scroll");
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let mode = null; // "h" | "v" | null

    swipeArea.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        lastY = t.clientY;
        dx = 0;
        dy = 0;
        mode = null;
      },
      { passive: true },
    );
    swipeArea.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        dx = t.clientX - startX;
        dy = t.clientY - startY;

        // Decide direction once (small deadzone to avoid jitter)
        if (mode === null) {
          const deadzone = 6;
          if (Math.abs(dx) < deadzone && Math.abs(dy) < deadzone) return;
          mode = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
        }

        if (mode === "v") {
          // Scroll the whole page by the finger delta (same "dimension")
          const deltaY = t.clientY - lastY;
          lastY = t.clientY;

          window.scrollBy({
            top: -deltaY * 2,
            behavior: "instant",
          });

          // Prevent browser from doing weird native handling on the element
          e.preventDefault();
        } else {
          // Horizontal gesture: prevent vertical scroll while swiping gallery
          e.preventDefault();
        }
      },
      { passive: false },
    );

    swipeArea.addEventListener(
      "touchend",
      (e) => {
        if (mode !== "h") return;
        const t = e.changedTouches[0];
        endX = t.clientX;
        endY = t.clientY;
        // console.log(endY);

        handleSwipe();
      },
      { passive: true },
    );

    function handleSwipe() {
      const swipeThreshold = 50;
      const ratio = 1.2;

      const dx = endX - startX;
      const dy = endY - startY;
      if (Math.abs(dy) > Math.abs(dx) / ratio) {
      }
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
  (() => {
    const reviewStarBlock = document.querySelectorAll(".review-star");
    const reviewSection = document.getElementById("looxReviews");
    if (!reviewStarBlock || !reviewSection) return;

    const lastReviewStar = reviewStarBlock[reviewStarBlock.length - 1];
    const firstReviewStar = reviewStarBlock[0];

    const handleScroll = (e) => {
      e.preventDefault();
      // e.stopPropagation();
      reviewSection.scrollIntoView({ behavior: "smooth", block: "center" });
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
      mainMediaContainer.appendChild(wrapperDiv);

      // DOTS
      const dotDiv = document.createElement("div");
      dotDiv.className = "dot";
      dotDiv.dataset.index = index;
      dotsContainer.appendChild(dotDiv);
      mainMediaContainer.scrollTo({ left: 0 });
    });
    resetDots();
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

      if (have2Options) updateButtonLabel("Select Size");
      if (oneOptionOnly) updateButtonLabel();
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
  updateButtonLabel();

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

  // FAQ expand handler
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
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
  var Dom = /*#__PURE__*/ (function () {
    function Dom() {
      _classCallCheck(this, Dom);
    }

    _createClass(Dom, null, [
      {
        key: "getSiblings",
        value:
          /**
           * Get all the previous and next siblings, optionally filtered by a selector
           */
          function getSiblings(element, filter) {
            var includeSelf =
              arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
            var siblings = [];
            var currentElement = element; // Do the previous first

            while ((currentElement = currentElement.previousElementSibling)) {
              if (!filter || currentElement.matches(filter)) {
                siblings.push(currentElement);
              }
            }

            if (includeSelf) {
              siblings.push(element);
            } // Then the next side

            currentElement = element;

            while ((currentElement = currentElement.nextElementSibling)) {
              if (!filter || currentElement.matches(filter)) {
                siblings.push(currentElement);
              }
            }

            return siblings;
          },
      },
      {
        key: "nodeListToArray",
        value: function nodeListToArray(nodeList, filter) {
          var items = [];

          for (var i = 0; i !== nodeList.length; ++i) {
            if (!filter || nodeList[i].matches(filter)) {
              items.push(nodeList[i]);
            }
          }

          return items;
        },
      },
      {
        key: "outerWidthWithMargin",
        value: function outerWidthWithMargin(element) {
          var width = element.offsetWidth,
            style = getComputedStyle(element);
          width += parseInt(style.marginLeft) + parseInt(style.marginRight);
          return width;
        },
      },
      {
        key: "outerHeightWithMargin",
        value: function outerHeightWithMargin(element) {
          var height = element.offsetHeight,
            style = getComputedStyle(element);
          height += parseInt(style.marginTop) + parseInt(style.marginBottom);
          return height;
        },
      },
    ]);

    return Dom;
  })();

  const Animation = (() => {
    function Animation() {
      _classCallCheck(this, Animation);
    }

    _createClass(Animation, null, [
      {
        key: "slideUp",
        value: function slideUp(element) {
          element.style.height = "".concat(element.scrollHeight, "px");
          element.offsetHeight; // Force redraw
          element.style.height = 0;
        },
      },
      {
        key: "slideDown",
        value: function slideDown(element) {
          if (element.style.height === "auto") {
            return;
          }

          element.style.height = "".concat(element.firstElementChild.scrollHeight, "px");

          var transitionEnded = function transitionEnded(event) {
            if (event.propertyName === "height") {
              element.style.height = "auto"; // Allows the content to grow normally

              element.removeEventListener("transitionend", transitionEnded);
            }
          };

          element.addEventListener("transitionend", transitionEnded);
        },
      },
    ]);

    return Animation;
  })();
  const faqItems = document.querySelectorAll(".Faq__Item");
  function _closeItem(item) {
    const answerWrapper = item.querySelector(".Faq__AnswerWrapper");
    item.setAttribute("aria-expanded", "false");
    answerWrapper.setAttribute("aria-hidden", "true");
    Animation.slideUp(answerWrapper);
  }
  function _openItem(item) {
    const answerWrapper = item.querySelector(".Faq__AnswerWrapper");
    item.setAttribute("aria-expanded", "true");
    answerWrapper.setAttribute("aria-hidden", "false");
    Animation.slideDown(answerWrapper, true);
    Dom.getSiblings(item, '[aria-expanded="true"]').forEach(function (siblingItem) {
      const siblingAnswerWrapper = siblingItem.querySelector(".Faq__AnswerWrapper");
      siblingItem.setAttribute("aria-expanded", "false");
      siblingAnswerWrapper.setAttribute("aria-hidden", "true");
      Animation.slideUp(siblingAnswerWrapper);
    });
  }

  faqItems.forEach((item) => {
    const button = item.querySelector(".Faq__Question");
    if (button) {
      button.addEventListener("click", function (e) {
        e.preventDefault(); // Prevent default button behavior
        if (item.getAttribute("aria-expanded") === "true") {
          _closeItem(item);
        } else {
          _openItem(item);
        }
      });
    }
  });
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
})();
