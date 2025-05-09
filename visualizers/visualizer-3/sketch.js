// ———————————————————————————————————————————————
// sketch.js
// ———————————————————————————————————————————————

let settings = {
  // Audio
  playSong: () => {
    const ac = getAudioContext();
    if (ac.state !== 'running') ac.resume();
    if (!song.isPlaying()) song.loop();
  },
  stopSong: () => {
    if (song.isPlaying()) song.stop();
  },

  // Forms
  addForm: () => {
    forms.push({ xOffset: 0, yOffset: 0, scale: 1, rotation: 0 });
    refreshFormsGUI();
  },

  // Colores
  colA: '#b7b7e6',
  colB: '#252525',
  backgroundColor: '#c8d2e1',

  // Geometría
  layers: 150,
  pointsPerLine: 100,
  formRadiusFactor: 0.25,

  // Banda e interacción
  freqBand: 'none', // 'none','bass','mid','treble'
  energyValue: 0,   // solo lectura

  // Parámetros base y mods
  noiseScaleBase: 0.006,
  offsetRangeBase: 20,
  noiseScaleAmp: 0.01,
  offsetRangeAmp: 45,
  bandNoiseAmp: 0.05,
  bandOffsetAmp: 50,

  // Transparencias
  alphaMin: 5,
  alphaMax: 75,
};

let forms = [
  { xOffset: 0, yOffset: -0.7, scale: 1, rotation: -2.7 },
  { xOffset: 0, yOffset:  0.7, scale: 1, rotation: -0.25 },
];

let formRadius;
let gui, formsFolder;
let song, analyzer, fft, grainBuffer;

function preload() {
  song = loadSound('sonido.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255);
  noFill();

  grainBuffer = createGraphics(floor(width/4), floor(height/4));
  grainBuffer.pixelDensity(1);

  analyzer = new p5.Amplitude();
  analyzer.setInput(song);
  fft = new p5.FFT();
  fft.setInput(song);

  updateFormRadius();
  setupGUI();
  frameRate(30);
}

function draw() {
  background(settings.backgroundColor);

  let level = analyzer.getLevel();
  let bandEnergy = settings.freqBand === 'none'
    ? 0
    : fft.getEnergy(settings.freqBand) / 255;
  settings.energyValue = bandEnergy;

  let bandNoiseMod = bandEnergy * settings.bandNoiseAmp;
  let bandOffsetMod = bandEnergy * settings.bandOffsetAmp;
  settings.noiseScale = settings.noiseScaleBase  + bandNoiseMod  + level * settings.noiseScaleAmp;
  settings.offsetRange = settings.offsetRangeBase + bandOffsetMod + level * settings.offsetRangeAmp;

  // Granulado
  grainBuffer.loadPixels();
  for (let y = 0; y < grainBuffer.height; y++) {
    for (let x = 0; x < grainBuffer.width; x++) {
      let n = noise(x * 0.1, y * 0.1, frameCount * 0.0001);
      let g = map(n, 0, 1, -10, 10);
      let idx = 4 * (y * grainBuffer.width + x);
      grainBuffer.pixels[idx]   = constrain(grainBuffer.pixels[idx]   + g, 0, 255);
      grainBuffer.pixels[idx+1] = constrain(grainBuffer.pixels[idx+1] + g, 0, 255);
      grainBuffer.pixels[idx+2] = constrain(grainBuffer.pixels[idx+2] + g, 0, 255);
    }
  }
  grainBuffer.updatePixels();
  image(grainBuffer, 0, 0, width, height);

  // Formas
  blendMode(MULTIPLY);
  push();
    translate(width/2, height/2);
    for (let f of forms) {
      push();
        translate(f.xOffset * formRadius, f.yOffset * formRadius);
        rotate(f.rotation);
        drawOrganicForm(0, 0, f.scale);
      pop();
    }
  pop();
  blendMode(BLEND);
}

function drawOrganicForm(offsetX, offsetY, scaleFactor) {
  let c1 = color(settings.colA),
      c2 = color(settings.colB);
  let layers = settings.layers,
      points = settings.pointsPerLine;
  if (width * height > 1e6) {
    layers = floor(layers * 0.8);
    points = floor(points * 0.8);
  }
  for (let i = 0; i < layers; i++) {
    let tNorm = map(i, 0, layers, -1, 1),
        wt    = map(abs(tNorm), 0, 1, 1, 0);
    let c = lerpColor(c1, c2, wt);
    c.setAlpha(map(abs(tNorm), 0, 1, settings.alphaMax, settings.alphaMin));
    stroke(c);
    strokeWeight(map(i, 0, layers, 0.1, 1.5));

    let radius = formRadius * sqrt(1 - tNorm*tNorm) * scaleFactor;
    beginShape();
    for (let j = 0; j < points; j++) {
      let angle = map(j, 0, points, 0, TWO_PI),
          x0    = radius * cos(angle),
          y0    = tNorm * formRadius * scaleFactor;
      let n1 = noise((x0+offsetX) * settings.noiseScale,
                     (y0+offsetY) * settings.noiseScale);
      let n2 = noise((x0+offsetX) * settings.noiseScale * 5,
                     (y0+offsetY) * settings.noiseScale * 5);
      let off = map(n1, 0, 1, -settings.offsetRange, settings.offsetRange)
              + map(n2, 0, 1, -settings.offsetRange/5, settings.offsetRange/5);
      vertex(
        x0 + cos(angle) * off + offsetX,
        y0 + sin(angle) * off + offsetY
      );
    }
    endShape(CLOSE);
  }
}

function updateFormRadius() {
  formRadius = min(width, height) * settings.formRadiusFactor;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateFormRadius();
  if (grainBuffer) grainBuffer.resizeCanvas(floor(width/4), floor(height/4));
}

function setupGUI() {
  gui = new dat.GUI();

  // 1) Audio
  gui.add(settings, 'playSong').name('▶ Play');
  gui.add(settings, 'stopSong').name('■ Stop');

  // 2) Colores
  gui.addColor(settings, 'colA').name('Color 1');
  gui.addColor(settings, 'colB').name('Color 2');
  gui.addColor(settings, 'backgroundColor').name('Fondo');

  // 3) Geometría
  gui.add(settings, 'layers', 50, 300, 1).name('Capas');
  gui.add(settings, 'pointsPerLine', 50, 200, 1).name('Puntos/Línea');
  gui.add(settings, 'formRadiusFactor', 0.15, 1, 0.01)
     .name('Escala').onChange(updateFormRadius);

  // 4) Parámetros de interacción
  gui.add(settings, 'freqBand', ['none','bass','mid','treble']).name('Interacción');
  gui.add(settings, 'energyValue', 0, 1).name('Nivel Banda').listen();

  // 5) Ruido y offset base
  gui.add(settings, 'noiseScaleBase', 0.001, 0.02, 0.0005).name('Base Noise');
  gui.add(settings, 'offsetRangeBase', 0, 100, 1).name('Base Offset');

  // 6) Band Strength
  const bandF = gui.addFolder('Band Strength');
  bandF.add(settings, 'bandNoiseAmp', 0, 0.1, 0.001).name('Noise Amp');
  bandF.add(settings, 'bandOffsetAmp', 0, 100, 1).name('Offset Amp');

  // 7) Global Amp
  const ampF = gui.addFolder('Global Amp');
  ampF.add(settings, 'noiseScaleAmp', 0, 0.05, 0.0005).name('Noise Amp');
  ampF.add(settings, 'offsetRangeAmp', 0, 100, 1).name('Offset Amp');

  // 8) Transparencias
  gui.add(settings, 'alphaMin', 0, 50, 1).name('Alpha Mín');
  gui.add(settings, 'alphaMax', 0, 100, 1).name('Alpha Máx');

  // 9) Al final: Forms + Add Form
  refreshFormsGUI();
  gui.add(settings, 'addForm').name('➕ Add Form');
}

function refreshFormsGUI() {
  if (gui.__folders['Forms']) {
    gui.removeFolder('Forms');
  }
  formsFolder = gui.addFolder('Forms');
  forms.forEach((f, idx) => {
    const fd = formsFolder.addFolder(`Form ${idx+1}`);
    fd.add(f, 'xOffset', -2, 2, 0.01).name('Despl. H');
    fd.add(f, 'yOffset', -2, 2, 0.01).name('Despl. V');
    fd.add(f, 'scale', 0.5, 2, 0.01).name('Escala');
    fd.add(f, 'rotation', -PI, PI, 0.01).name('Rotación');
    fd.add({ remove: () => {
      forms.splice(idx, 1);
      refreshFormsGUI();
    }}, 'remove').name('❌ Remove');
  });
}

// Extensión para borrar carpetas
dat.GUI.prototype.removeFolder = function(name) {
  const folder = this.__folders[name];
  if (!folder) return;
  folder.close();
  this.__ul.removeChild(folder.domElement.parentNode);
  delete this.__folders[name];
  this.onResize();
};
