(function () {
  "use strict";

  const body = document.body;
  const canvas = document.getElementById("world-canvas");
  const fallback = document.getElementById("world-fallback");
  const header = document.getElementById("site-header");
  const menuToggle = document.getElementById("menu-toggle");
  const navigation = document.getElementById("primary-navigation");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let world = null;

  function activateFallback() {
    body.classList.add("webgl-fallback");
    if (fallback) fallback.setAttribute("aria-hidden", "true");
  }

  try {
    if (!window.VelaNorthWorld) throw new Error("World runtime unavailable.");
    world = window.VelaNorthWorld.init(canvas);
    body.classList.add("webgl-ready");
  } catch (error) {
    activateFallback();
  }

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  function setMenu(open) {
    menuToggle.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("is-open", open);
    navigation.style.visibility = open ? "visible" : "";
  }

  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      menuToggle.getAttribute("aria-expanded") === "true" &&
      !navigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      setMenu(false);
    }
  });

  const form = document.getElementById("quote-form");
  const successPanel = document.getElementById("form-success");
  const resetButton = document.getElementById("reset-form");
  const requiredFields = Array.from(form.querySelectorAll("[required]"));

  function errorMessage(field) {
    if (field.validity.valueMissing) {
      if (field.tagName === "SELECT") return "Choose a freight mode.";
      return "Complete this field.";
    }
    if (field.validity.typeMismatch && field.type === "email") {
      return "Enter an email in the format name@example.com.";
    }
    return "Check this field and try again.";
  }

  function validateField(field) {
    const error = document.getElementById(`${field.id}-error`);
    const valid = field.checkValidity();
    field.setAttribute("aria-invalid", String(!valid));
    if (error) error.textContent = valid ? "" : errorMessage(field);
    return valid;
  }

  requiredFields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
    field.addEventListener("change", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const results = requiredFields.map(validateField);
    if (results.includes(false)) {
      const firstInvalid = requiredFields.find((field) => field.getAttribute("aria-invalid") === "true");
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    successPanel.hidden = false;
    successPanel.focus();
  });

  resetButton.addEventListener("click", () => {
    successPanel.hidden = true;
    form.reset();
    requiredFields.forEach((field) => {
      field.removeAttribute("aria-invalid");
      const error = document.getElementById(`${field.id}-error`);
      if (error) error.textContent = "";
    });
    document.getElementById("name").focus();
  });

  function setupReducedMotion() {
    body.classList.add("reduced-motion");
    if (world) world.setProgress(1);
  }

  function setupMotion() {
    if (
      reducedMotionQuery.matches ||
      !world ||
      !window.gsap ||
      !window.ScrollTrigger
    ) {
      setupReducedMotion();
      return;
    }

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const portrait = window.matchMedia("(max-width: 780px)").matches;
    const frames = portrait
      ? {
          roadCamera: { x: 7.2, y: 5.15, z: -11.8 },
          roadTarget: { x: 2.7, y: 0.45, z: -22 },
          seaCamera: { x: 9.6, y: 6.5, z: -44.5 },
          seaTarget: { x: -1.8, y: -0.45, z: -60 },
          airCamera: { x: 8.4, y: 5.9, z: -92.5 },
          airTarget: { x: 2.3, y: -0.8, z: -109.5 },
          journeyCamera: { x: 5.0, y: 5.2, z: -127.2 },
          journeyTarget: { x: 0.1, y: 0.35, z: -140.5 },
          finalCamera: { x: 3.8, y: 5.5, z: -134.0 },
          finalTarget: { x: 0, y: 0.5, z: -141.2 }
        }
      : {
          roadCamera: { x: 8.4, y: 4.8, z: -12.5 },
          roadTarget: { x: 2.7, y: 1.25, z: -22 },
          seaCamera: { x: 8.8, y: 5.7, z: -46.5 },
          seaTarget: { x: 2.4, y: 1.45, z: -59.8 },
          airCamera: { x: 8.2, y: 5.7, z: -93.8 },
          airTarget: { x: -2.1, y: 1.7, z: -109.5 },
          journeyCamera: { x: 5.2, y: 5.0, z: -128.5 },
          journeyTarget: { x: 0.1, y: 2.2, z: -140.5 },
          finalCamera: { x: 2.7, y: 4.2, z: -135.6 },
          finalTarget: { x: 0, y: 1.5, z: -141.2 }
        };
    gsap.registerPlugin(ScrollTrigger);
    body.classList.add("motion-ready");

    const camera = world.camera;
    const target = world.target;
    const timeline = gsap.timeline({
      defaults: { ease: "power1.inOut" },
      scrollTrigger: {
        trigger: "#scroll-journey",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        invalidateOnRefresh: true
      }
    });

    timeline
      .addLabel("dispatch", 0)
      .to(camera.position, { ...frames.roadCamera, duration: 1.05 }, 0.08)
      .to(target, { ...frames.roadTarget, duration: 1.05 }, 0.08)
      .fromTo(
        "#services-road .scene-copy",
        { y: 54, opacity: 0.18 },
        { y: 0, opacity: 1, duration: 0.48, ease: "power2.out", immediateRender: false },
        0.68
      )
      .addLabel("road", 1.08)
      .to(camera.position, { ...frames.seaCamera, duration: 1.08 }, 1.08)
      .to(target, { ...frames.seaTarget, duration: 1.08 }, 1.08)
      .to(world.objects.truck.rotation, { y: -Math.PI / 2 + 0.08, duration: 0.82 }, 1.08)
      .fromTo(
        "#services-sea .scene-copy",
        { y: 54, opacity: 0.18 },
        { y: 0, opacity: 1, duration: 0.48, ease: "power2.out", immediateRender: false },
        1.75
      )
      .addLabel("sea", 2.42)
      .to(camera.position, { ...frames.airCamera, duration: 0.88 }, 2.42)
      .to(target, { ...frames.airTarget, duration: 0.88 }, 2.42)
      .to(world.objects.ship.rotation, { y: 0.15, duration: 0.7 }, 2.42)
      .fromTo(
        "#services-air .scene-copy",
        { y: 54, opacity: 0.18 },
        { y: 0, opacity: 1, duration: 0.48, ease: "power2.out", immediateRender: false },
        2.86
      )
      .addLabel("air", 3.72)
      .to(camera.position, { ...frames.journeyCamera, duration: 0.72 }, 3.72)
      .to(target, { ...frames.journeyTarget, duration: 0.72 }, 3.72)
      .to(world.objects.aircraft.rotation, { z: 0.035, duration: 0.68 }, 3.72)
      .fromTo(
        "#journey .journey-heading",
        { y: 44, opacity: 0.18 },
        { y: 0, opacity: 1, duration: 0.46, ease: "power2.out", immediateRender: false },
        4.0
      )
      .fromTo(
        "#journey .journey-steps li",
        { x: 42, opacity: 0.2 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          immediateRender: false
        },
        4.06
      )
      .addLabel("journey", 4.46)
      .to(camera.position, { ...frames.finalCamera, duration: 0.72 }, 4.46)
      .to(target, { ...frames.finalTarget, duration: 0.72 }, 4.46);

    timeline.eventCallback("onUpdate", () => {
      const value = timeline.progress();
      world.setProgress(value);
      document.documentElement.style.setProperty("--route-progress", value.toFixed(4));
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  setupMotion();
})();
