let uploadedImg = null;
let selectedColor = "#CCFF00";
let selectedPos = "right";
let selectedSize = "xs";

const sizeRanges = {
  xs: [0.01, 0.02],
  sm: [0.018, 0.032],
  md: [0.03, 0.075],
};

// ── Upload ──────────────────────────────────────────────
const fileIn = document.getElementById("fileIn");
const uploadZone = document.getElementById("uploadZone");

uploadZone.addEventListener("click", () => fileIn.click());

fileIn.addEventListener("change", (e) => loadFile(e.target.files[0]));

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});
uploadZone.addEventListener("dragleave", () =>
  uploadZone.classList.remove("drag-over"),
);
uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) loadFile(file);
});

function loadFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      uploadedImg = img;
      const thumb = document.getElementById("thumbImg");
      thumb.src = ev.target.result;
      thumb.style.display = "block";
      document.getElementById("uploadLabel").textContent = file.name;
      document.getElementById("uploadSub").textContent =
        img.width + " × " + img.height + "px";
      document.getElementById("genBtn").disabled = false;
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// ── Color swatches ──────────────────────────────────────
document.querySelectorAll(".color-swatch").forEach((el) => {
  el.addEventListener("click", () => {
    document
      .querySelectorAll(".color-swatch")
      .forEach((s) => s.classList.remove("active"));
    el.classList.add("active");
    selectedColor = el.dataset.color;
    document.getElementById("colorPicker").value = selectedColor;
    document.getElementById("customSwatch").style.background = selectedColor;
  });
});

document.getElementById("colorPicker").addEventListener("input", function () {
  selectedColor = this.value;
  document
    .querySelectorAll(".color-swatch")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("customSwatch").style.background = selectedColor;
});

// ── Placement ───────────────────────────────────────────
document.querySelectorAll(".pos-btn").forEach((el) => {
  el.addEventListener("click", () => {
    document
      .querySelectorAll(".pos-btn")
      .forEach((b) => b.classList.remove("active"));
    el.classList.add("active");
    selectedPos = el.dataset.pos;
  });
});

// ── Size ────────────────────────────────────────────────
document.querySelectorAll(".seg-btn").forEach((el) => {
  el.addEventListener("click", () => {
    document
      .querySelectorAll(".seg-btn")
      .forEach((b) => b.classList.remove("active"));
    el.classList.add("active");
    selectedSize = el.dataset.size;
  });
});

// ── Canvas helpers ──────────────────────────────────────
function drawStarPath(ctx, cx, cy, r) {
  const inner = r * 0.45;
  const pts = 5;
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const angle = (i * Math.PI) / pts - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function pasteStarFromSrc(ctx, srcCanvas, srcX, srcY, destX, destY, r) {
  ctx.save();
  drawStarPath(ctx, destX, destY, r);
  ctx.clip();
  ctx.drawImage(
    srcCanvas,
    srcX - r,
    srcY - r,
    r * 2,
    r * 2,
    destX - r,
    destY - r,
    r * 2,
    r * 2,
  );
  ctx.restore();
  ctx.save();
  drawStarPath(ctx, destX, destY, r);
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function fillStarColor(ctx, cx, cy, r, color) {
  ctx.save();
  drawStarPath(ctx, cx, cy, r);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// ── Generate ────────────────────────────────────────────
document.getElementById("genBtn").addEventListener("click", generate);

function generate() {
  if (!uploadedImg) return;
  const img = uploadedImg;
  const W = img.width;
  const H = img.height;

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = W;
  srcCanvas.height = H;
  srcCanvas.getContext("2d").drawImage(img, 0, 0, W, H);

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const horiz = selectedPos === "left" || selectedPos === "right";

  canvas.width = horiz ? W * 2 : W;
  canvas.height = horiz ? H : H * 2;

  let imgX = 0,
    imgY = 0,
    rectX = 0,
    rectY = 0;
  if (selectedPos === "right") {
    imgX = 0;
    imgY = 0;
    rectX = W;
    rectY = 0;
  }
  if (selectedPos === "left") {
    imgX = W;
    imgY = 0;
    rectX = 0;
    rectY = 0;
  }
  if (selectedPos === "bottom") {
    imgX = 0;
    imgY = 0;
    rectX = 0;
    rectY = H;
  }
  if (selectedPos === "top") {
    imgX = 0;
    imgY = H;
    rectX = 0;
    rectY = 0;
  }

  ctx.fillStyle = selectedColor;
  ctx.fillRect(rectX, rectY, horiz ? W : W, horiz ? H : H);
  ctx.drawImage(img, imgX, imgY, W, H);

  const numStars = 13 + Math.floor(Math.random() * 8);
  const minDim = Math.min(W, H);
  const [minScale, maxScale] = sizeRanges[selectedSize];

  for (let i = 0; i < numStars; i++) {
    const starR = minDim * (minScale + Math.random() * (maxScale - minScale));

    const photoX = imgX + starR + Math.random() * (W - starR * 2);
    const photoY = imgY + starR + Math.random() * (H - starR * 2);

    const relX = photoX - imgX;
    const relY = photoY - imgY;

    // Color star punched into photo
    fillStarColor(ctx, photoX, photoY, starR, selectedColor);

    // Photo-texture star placed on rect at same relative position
    pasteStarFromSrc(
      ctx,
      srcCanvas,
      relX,
      relY,
      rectX + relX,
      rectY + relY,
      starR,
    );
  }

  canvas.style.display = "block";
  document.getElementById("placeholder").style.display = "none";
  document.getElementById("dlBtn").style.display = "block";
}

// ── Download ────────────────────────────────────────────
document.getElementById("dlBtn").addEventListener("click", async () => {
  const canvas = document.getElementById("c");

  // try native share sheet first (mobile)
  if (navigator.share && navigator.canShare) {
    canvas.toBlob(
      async (blob) => {
        const file = new File([blob], "star-scatter.jpg", {
          type: "image/jpeg",
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "star scatter ✦",
          });
          return;
        }
        fallbackDownload(canvas);
      },
      "image/jpeg",
      0.95,
    );
  } else {
    // desktop fallback
    fallbackDownload(canvas);
  }
});

function fallbackDownload(canvas) {
  const link = document.createElement("a");
  link.download = "star-scatter.jpg";
  link.href = canvas.toDataURL("image/jpeg", 0.95);
  link.click();
}
