document.addEventListener("DOMContentLoaded", function () {
  const variants = this.querySelector(".variants-container");
  const colorContainer = variants.querySelector(".color-size-variant-container") || null;
  const sizeContainer = variants.querySelector(".variant-size") || null;
  const inputVariant = this.querySelector('input[name="id"]');

  //  Add active class to first color and size option by default
  if (colorContainer) {
    const firstColor = colorContainer.querySelector(".variant-image");
    if (firstColor) {
      firstColor.classList.add("active");
    }
  }
  if (sizeContainer) {
    const firstSize = sizeContainer.querySelector(".title-size");
    if (firstSize) {
      firstSize.classList.add("active");
    }
  }

  // DATA variant mapping
  const productJsonEl = document.querySelector('[id^="ProductJson-"]');
  if (!productJsonEl) return;
  const productData = JSON.parse(productJsonEl.textContent);
  // console.log(productData);
  const colorArray = [];
  productData.variants.forEach((variant) => {
    const color = variant.options[0];
    if (!colorArray.includes(color)) {
      colorArray.push(color);
    }
  });
  const colorVariantData = {};
  colorArray.forEach((color) => {
    colorVariantData[color] = productData.variants.filter(
      (variant) => variant.options[0] === color,
    );
  });
  // console.log(colorVariantData);
  // ////////////////////////////////////////////////
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
    // console.log(variantId);
    if (!variantId) return null;

    return (inputVariant.value = variantId.id);
  }
  setInputValue();

  // DOM Manipulation for size and color selection
  // color selection
  if (colorContainer) {
    const colorBtn = colorContainer.querySelector(".variant-image-container-color");
    if (!colorBtn) return;
    const images = colorContainer.querySelectorAll(".variant-image");
    images.forEach((img) => {
      img.addEventListener("click", (e) => {
         e.stopPropagation();
        images.forEach((i) => i.classList.remove("active"));
        img.classList.add("active");
        setInputValue();
      });
    });
  }
  // size selection
  if (sizeContainer) {
    const sizeBtn = sizeContainer.querySelectorAll(".title-size");

    const selectedSize = this.getElementById("after-select-size");
    if (!sizeBtn) return;
    sizeBtn.forEach((size) => {
      size.addEventListener("click", (e) => {
        // console.log("clicked");
         e.stopPropagation();
        sizeBtn.forEach((i) => i.classList.remove("active"));
        size.classList.add("active");
        selectedSize.style.display = "block";
        selectedSize.textContent = `Size: ${size.textContent}`;
        setInputValue();
      });
    });
  }
  // PRODUCT GALLERY
  const productMediaContainer = this.querySelector(".product-gallery-info-container");
  const mainMedia = this.getElementById("product-media-container-for-scroll");
  const slides = mainMedia.querySelectorAll(".product-media");
  const dotsContainer = this.querySelector(".dots-container");
  const sideMediaContainer = this.querySelector(".side-product-media-container");
  const dots = dotsContainer.querySelectorAll(".dot");
  let currentIndex = 0;

  function scrollToIndex(index) {
    if (!slides[index]) return;

    const slide = slides[index];
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
});
