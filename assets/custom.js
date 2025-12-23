/**
 * Include your custom JavaScript here.
 *
 * We also offer some hooks so you can plug your own logic. For instance, if you want to be notified when the variant
 * changes on product page, you can attach a listener to the document:
 *
 * document.addEventListener('variant:changed', function(event) {
 *   var variant = event.detail.variant; // Gives you access to the whole variant details
 * });
 *
 * You can also add a listener whenever a product is added to the cart:
 *
 * document.addEventListener('product:added', function(event) {
 *   var variant = event.detail.variant; // Get the variant that was added
 *   var quantity = event.detail.quantity; // Get the quantity that was added
 * });
 *
 * If you just want to force refresh the mini-cart without adding a specific product, you can trigger the event
 * "cart:refresh" in a similar way (in that case, passing the quantity is not necessary):
 *
 * document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
 *   bubbles: true
 * }));
 */
$(document).ready(function(){
 $('.first-child .Faq__Question').click();
})

// logo section slider code js 

  $(document).ready(function(){
    var $slider = $('.custom-logo-list-wrapper');

    $slider.on('init reInit afterChange', function(event, slick, currentSlide){
      let i = (currentSlide ? currentSlide : 0) + 1;
      $('.slider-count .current').text(i);
      $('.slider-count .total').text(slick.slideCount);
    });

    $slider.slick({
      slidesToShow: 5,
      arrows: true,
      infinite: false,
      nextArrow: `<button type="button" class="slick-next" aria-label="Next">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="7 2 17 12 7 22"></polyline>
                    </svg>
                  </button>`,
      prevArrow: `<button type="button" class="slick-prev" aria-label="Previous">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="scale(-1,1) translate(-24,0)">
                      <polyline points="7 2 17 12 7 22"></polyline>
                    </svg>
                  </button>`,
      responsive: [
        { breakpoint: 1200, settings: { slidesToShow: 4, arrows: true,  infinite: true } },
        { breakpoint: 990, settings: { slidesToShow: 3, arrows: true,  infinite: true } },
        { breakpoint: 820, settings: { slidesToShow: 2, arrows: true,  infinite: true } },
        { breakpoint: 600, settings: { slidesToShow: 1, arrows: true } }
      ]
    });
  });
