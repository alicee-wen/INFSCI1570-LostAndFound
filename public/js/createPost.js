document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-post-form");
  if (!form) {
    return;
  }

  const useLocationBtn = document.getElementById("use-location-btn");
  const locationInput = document.getElementById("location");
  const locationStatus = document.getElementById("location-status");

  const STORAGE_KEY = "lost_found_post_draft";

  // load draft from localStorage
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.keys(data).forEach((name) => {
        const field = form.elements.namedItem(name);
        if (!field) return;

        if (field.type === "file") return;

        field.value = data[name];
      });
      console.log("draft restored");
    } catch (err) {
      console.error("Error getting saved draft:", err);
    }
  }

  // save draft when any field changes
  function saveDraft() {
    const data = {};

    Array.from(form.elements).forEach((el) => {
      if (!el.name) return;

      data[el.name] = el.value;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("Draft saved:", data);
  }

  form.addEventListener("input", saveDraft);
  form.addEventListener("change", saveDraft);

  // clear draft when form submits
  form.addEventListener("submit", () => {
    localStorage.removeItem(STORAGE_KEY);
    console.log("draft cleared");
  });

  // geolocation API
  if (useLocationBtn && locationInput && locationStatus) {
    useLocationBtn.addEventListener("click", () => {
      if (!("geolocation" in navigator)) {
        console.log("Geolocation not supported.");
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;

          // put coords into location input box
          locationInput.value = `Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)}`;
          saveDraft();
        },
        (err) => {
          console.log("Could not get location");
        }
      );
    });
  } else {
    console.log("Geolocation elements not found");
  }
});
