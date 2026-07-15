(() => {
  const init = () => {
    console.log("Bidlot content script loaded");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
