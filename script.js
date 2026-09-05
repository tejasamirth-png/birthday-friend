const canvas = document.querySelector("#confettiCanvas");
const ctx = canvas.getContext("2d");
const surpriseButtons = document.querySelectorAll("[data-surprise]");
const dialog = document.querySelector("[data-dialog]");
const surpriseVideo = document.querySelector("[data-surprise-video]");
const closeButtons = document.querySelectorAll("[data-close]");
const memoryCards = Array.from(document.querySelectorAll(".memory-card"));
const dots = Array.from(document.querySelectorAll("[data-gallery-dot]"));
const prevButton = document.querySelector("[data-gallery-prev]");
const nextButton = document.querySelector("[data-gallery-next]");

let particles = [];
let animationFrame = null;
let activeMemory = 0;

const colors = ["#f15445", "#ff9a91", "#c98719", "#24564d", "#5b8f3f"];

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function makeParticle(originX, originY) {
  const angle = Math.random() * Math.PI * 2;
  const velocity = 4 + Math.random() * 8;

  return {
    x: originX,
    y: originY,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity - 4,
    size: 5 + Math.random() * 7,
    rotate: Math.random() * Math.PI,
    spin: -0.2 + Math.random() * 0.4,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 80 + Math.random() * 40,
    maxLife: 120,
  };
}

function drawParticle(particle) {
  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.rotate);
  ctx.globalAlpha = Math.max(particle.life / particle.maxLife, 0);
  ctx.fillStyle = particle.color;
  ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 1.35);
  ctx.restore();
}

function tick() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles = particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vy: particle.vy + 0.22,
      rotate: particle.rotate + particle.spin,
      life: particle.life - 1,
    }))
    .filter((particle) => particle.life > 0);

  particles.forEach(drawParticle);

  if (particles.length > 0) {
    animationFrame = requestAnimationFrame(tick);
  } else {
    animationFrame = null;
  }
}

function burstFromElement(element) {
  const rect = element.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reducedMotion) {
    particles.push(...Array.from({ length: 130 }, () => makeParticle(originX, originY)));
    if (!animationFrame) {
      tick();
    }
  }

  if (dialog && typeof dialog.showModal === "function" && !dialog.open) {
    dialog.showModal();
  }

  if (surpriseVideo) {
    surpriseVideo.dataset.playbackState = "starting";
    surpriseVideo.currentTime = 0;
    surpriseVideo
      .play()
      .then(() => {
        surpriseVideo.dataset.playbackState = "playing";
      })
      .catch(() => {
        surpriseVideo.dataset.playbackState = "needs-user-play";
        surpriseVideo.controls = true;
      });
  }
}

function closeSurprise() {
  if (surpriseVideo) {
    surpriseVideo.pause();
    surpriseVideo.dataset.playbackState = "paused";
  }

  if (dialog?.open) {
    dialog.close();
  }
}

function setActiveMemory(index) {
  activeMemory = (index + memoryCards.length) % memoryCards.length;

  memoryCards.forEach((card, cardIndex) => {
    card.classList.toggle("is-active", cardIndex === activeMemory);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === activeMemory);
  });
}

surpriseButtons.forEach((button) => {
  button.addEventListener("click", () => burstFromElement(button));
});

closeButtons.forEach((button) => {
  button.addEventListener("click", closeSurprise);
});

dialog?.addEventListener("click", (event) => {
  const dialogRect = dialog.getBoundingClientRect();
  const isInside =
    event.clientX >= dialogRect.left &&
    event.clientX <= dialogRect.right &&
    event.clientY >= dialogRect.top &&
    event.clientY <= dialogRect.bottom;

  if (!isInside) {
    closeSurprise();
  }
});

prevButton?.addEventListener("click", () => setActiveMemory(activeMemory - 1));
nextButton?.addEventListener("click", () => setActiveMemory(activeMemory + 1));

dots.forEach((dot) => {
  dot.addEventListener("click", () => setActiveMemory(Number(dot.dataset.galleryDot)));
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
setActiveMemory(0);
