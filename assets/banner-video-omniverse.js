document.addEventListener("DOMContentLoaded", function () {
  const playButton = document.getElementById("play-button");
  const videoElement = document.getElementById("video-omniverse");
  const playIcon = document.getElementById("video-play-button");
  const pauseIcon = document.getElementById("video-pause-button");

  playButton.addEventListener("click", function () {
    if (videoElement.paused) {
      videoElement.play();
      playIcon.style.display = "none";
      pauseIcon.style.display = "block";
      playButton.classList.add("playing");
    } else {
      videoElement.pause();
      playIcon.style.display = "block";
      pauseIcon.style.display = "none";
      playButton.classList.remove("playing");
    }
  });
});
