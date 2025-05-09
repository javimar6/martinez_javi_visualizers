// sketch.js
let song;
let amp, fft, peakDetect;
let params;
let gui;
let bgGraphics;

let currentSegCount = 1;

function preload() {
  song = loadSound('sonido.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);
  frameRate(30);

  // Audio
  amp = new p5.Amplitude();
  fft = new p5.FFT(0.8, 1024);
  peakDetect = new p5.PeakDetect(20, 20000, 0.1, 25);
  amp.setInput(song);
  fft.setInput(song);

  // Parámetros
  params = {
    texto:                  "LABASAD!",
    ondas:                  4,
    segmentos:              15,
    spacing:                100,    // spacing base
    textSize:               10,
    repeats:                3,
    velocidad:              1.0,
    ovalidad:               0.5,
    showWaves:              true,
    grainStrength:          0.6,
    color:                  "#ffffff",
    bgColor:                "#000000",

    // Toggles para reactividad al sonido
    useReactiveSegments:    true,
    useReactiveSpacing:     true,
    useReactiveAmplitude:   true
  };

  // Capa de granulado
  bgGraphics = createGraphics(width, height);
  bgGraphics.pixelDensity(1);
  bgGraphics.background(params.bgColor);

  // dat.GUI
  gui = new dat.GUI();
  gui.add(params, "texto").name("Texto");
  gui.add(params, "ondas",           1, 20, 1).name("Ondas");
  gui.add(params, "segmentos",       2, 50, 1).name("Max segmentos");
  gui.add(params, "spacing",        10,200, 1).name("Spacing base");
  gui.add(params, "textSize",        8, 64, 1).name("Tamaño letra");
  gui.add(params, "repeats",         1, 20, 1).name("Repeticiones");
  gui.add(params, "velocidad",       0,  5,0.1).name("Velocidad");
  gui.add(params, "ovalidad",        0,  1,0.01).name("Ovalidad");
  gui.add(params, "showWaves").name("Granulado");
  gui.add(params, "grainStrength",   0,  1,0.01).name("Intensidad grano");
  gui.addColor(params, "color").name("Color texto");
  gui.addColor(params, "bgColor").name("Color fondo")
     .onChange(c => bgGraphics.background(c));

  // ---- Toggles de reactividad ----
  let folder = gui.addFolder("Reactividad al sonido");
  folder.add(params, "useReactiveSegments").name("Segments");
  folder.add(params, "useReactiveSpacing").name("Spacing");
  folder.add(params, "useReactiveAmplitude").name("Amplitud");
  folder.open();

  // Controles de reproducción
  gui.add({ play:  () => song.play()  }, 'play').name('Play');
  gui.add({ pause: () => song.pause() }, 'pause').name('Pausa');
}

function draw() {
  // Fading de grano
  bgGraphics.push();
    bgGraphics.noStroke();
    let fade = bgGraphics.color(params.bgColor);
    fade.setAlpha(10);
    bgGraphics.fill(fade);
    bgGraphics.rect(0, 0, width, height);
  bgGraphics.pop();
  image(bgGraphics, 0, 0);

  // Análisis de audio
  fft.analyze();
  peakDetect.update(fft);
  let level    = amp.getLevel();
  let bass     = fft.getEnergy('bass') / 255;    // normalizado 0–1
  let noiseVal = noise(frameCount * 0.02);
  let t        = frameCount * params.velocidad;

  // 1) Segments: dinámicos o fijos
  if (params.useReactiveSegments) {
    currentSegCount = max(
      1,
      floor( lerp(1, params.segmentos, bass * noiseVal) )
    );
  } else {
    currentSegCount = params.segmentos;
  }

  // 2) Spacing: dinámico o base
  let spacingVal;
  if (params.useReactiveSpacing) {
    // mapear bass→[0.5,1.5] y añadir un poco de ruido
    let mapped = lerp(0.5, 1.5, bass);
    spacingVal = params.spacing * mapped * lerp(0.8, 1.2, noiseVal);
  } else {
    spacingVal = params.spacing;
  }

  // Dibujar
  translate(width/2, height/2);
  drawSingleWave(0, level, t, null, spacingVal);

  for (let s = 0; s < currentSegCount; s++) {
    push();
      rotate((360 / currentSegCount) * s);
      if (s % 2 === 1) scale(-1, 1);
      for (let i = 1; i < params.ondas; i++) {
        drawSingleWave(i, level, t, s, spacingVal);
      }
    pop();
  }
}

function drawSingleWave(i, level, t, segmentIndex, spacingVal) {
  let baseR  = i * spacingVal;
  let deform = sin(t + i * 20) * params.ovalidad;

  // 3) Amplitud: si está activada, sumamos el map(level) a baseR
  let rWave = params.useReactiveAmplitude
    ? baseR + map(level, 0, 0.5, 0, spacingVal * 0.8)
    : baseR;

  push();
    if (i === 0) scale(1, 1 - deform);
    else         scale(1 + deform, 1 - deform);

    // Granulado
    if (params.showWaves) {
      let c = bgGraphics.color(params.color);
      c.setAlpha(params.grainStrength * 255);
      bgGraphics.noStroke();
      bgGraphics.fill(c);

      let reps   = (i === 0) ? 1 : params.repeats;
      let step   = 360 / reps;
      let startA = -180 + step/2;

      for (let k = 0; k < reps; k++) {
        let ang = startA + k * step;
        let gx  = cos(ang) * rWave;
        let gy  = sin(ang) * rWave;
        let sz  = map(level, 0, 0.5, 2, 8) * params.grainStrength;
        bgGraphics.push();
          bgGraphics.translate(width/2, height/2);
          if (segmentIndex !== null) {
            bgGraphics.rotate((360 / currentSegCount) * segmentIndex);
            if (segmentIndex % 2 === 1) bgGraphics.scale(-1, 1);
          }
          if (i === 0) scale(1, 1 - deform);
          else         scale(1 + deform, 1 - deform);
          bgGraphics.ellipse(gx, gy, sz);
        bgGraphics.pop();
      }
    }

    // Texto en baseR (sin “salto”)
    noStroke();
    fill(params.color);
    textSize(params.textSize);
    let reps   = (i === 0) ? 1 : params.repeats;
    let step   = 360 / reps;
    let startA = -180 + step/2;
    for (let k = 0; k < reps; k++) {
      push();
        rotate(startA + k * step);
        translate(0, -baseR);
        text(params.texto, 0, 0);
      pop();
    }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  bgGraphics.resizeCanvas(windowWidth, windowHeight);
}
