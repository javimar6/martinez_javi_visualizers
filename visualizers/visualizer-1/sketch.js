// sketch.js

let video, buffer, fft, soundFile;
let isFrozen = false;
let isTextVisible = true;

let peakDetectors = {
  bass: null,
  mid: null,
  treble: null
};

const W = 320, H = 180;
const FADE_AMOUNT = 15;

const settings = {
  brightness:        10,
  contrast:          0.8,
  exposure:          0.15,
  scanline:          1.1,
  blacksMin:         75,

  freezeBand:        'bass',
  freezeProb:        0.5,
  unfreezeProb:      0.3,
  freezeMode:        'random', // 'random', 'never'

  customText:        'CONTRAST PROJECT',
  textOffsetX:       0.5,
  textOffsetY:       0.5,
  customTextSize:    15,
  customTextColor:   '#ffffff',
  textVisibilityMode:'always',
  textToggleProb:    0.15,
  justifyText:       false,

  audioStarted:      false,

  startAudio() {
    userStartAudio();
    const ctx = getAudioContext();
    if (ctx.state !== 'running') ctx.resume();
    soundFile.loop();
    fft.setInput(soundFile);
    this.audioStarted = true;
    console.log('🎧 Audio iniciado');
  },

  pauseAudio() {
    if (this.audioStarted) {
      soundFile.pause();
      console.log('⏸️ Audio en pausa');
    }
  }
};

function preload() {
  soundFile = loadSound('sonido.mp3');
}

function setup() {
  // canvas + video setup
  const cnv = createCanvas(windowWidth, windowHeight);
  frameRate(30);
  cnv.parent(document.querySelector('.canvas-container'));
  pixelDensity(1);

  video = createCapture(VIDEO);
  video.size(W, H);
  video.hide();

  buffer = createGraphics(W, H);
  buffer.pixelDensity(1);

  // FFT & peak detectors
  fft = new p5.FFT();
  peakDetectors.bass   = new p5.PeakDetect(20, 140);
  peakDetectors.mid    = new p5.PeakDetect(140, 4000);
  peakDetectors.treble = new p5.PeakDetect(4000, 20000);

  // dat.GUI
  const gui = new dat.GUI({ width: 300 });
  gui.add(settings, 'brightness', -50, 50, 1).name('Brillo');
  gui.add(settings, 'contrast',   0.8, 1.2, 0.005).name('Contraste');
  gui.add(settings, 'exposure',   0.0, 0.5, 0.01).name('Exposición');
  gui.add(settings, 'scanline',   0.5, 3.0, 0.1).name('Scanlines');
  gui.add(settings, 'blacksMin',  0, 100, 1).name('Negros');

  const fz = gui.addFolder('Freeze Aleatorio');
  fz.add(settings, 'freezeBand',   { Graves:'bass', Medios:'mid', Agudos:'treble' }).name('Banda');
  fz.add(settings, 'freezeProb',    0, 1, 0.01).name('Prob. Congelar');
  fz.add(settings, 'unfreezeProb',  0, 1, 0.01).name('Prob. Descongelar');
  fz.add(settings, 'freezeMode',   ['random','never']).name('Modo');
  fz.open();

  const txt = gui.addFolder('Texto Personalizado');
  // create a text controller for customText
  let textController = txt.add(settings, 'customText').name('Texto');
  txt.add(settings, 'textOffsetX', 0, 1, 0.01).name('Pos X');
  txt.add(settings, 'textOffsetY', 0, 1, 0.01).name('Pos Y');
  txt.add(settings, 'customTextSize', 10, 72, 1).name('Tamaño Texto');
  txt.addColor(settings, 'customTextColor').name('Color Texto');
  txt.add(settings, 'textVisibilityMode', ['always','never','random']).name('Visibilidad');
  txt.add(settings, 'textToggleProb', 0, 1, 0.01).name('Prob. Toggle');
  txt.add(settings, 'justifyText').name('Justificar');
  txt.open();

  // audio controls
  gui.add(settings, 'startAudio').name('Iniciar Audio');
  gui.add(settings, 'pauseAudio').name('Pausar Audio');

  // replace the single-line input with a multiline <textarea>
  const input = textController.domElement; 
  const textarea = document.createElement('textarea');
  textarea.value = settings.customText;
  textarea.rows = 4;
  textarea.style.width = '160px';
  textarea.style.marginTop = '4px';
  textarea.oninput = () => settings.customText = textarea.value;
  input.parentElement.replaceChild(textarea, input);
  textController.domElement = textarea;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawCustomText() {
  if (!isTextVisible) return;

  const lines = settings.customText.split('\n');
  textSize(settings.customTextSize);
  fill(settings.customTextColor);

  const lineHeight = settings.customTextSize * 1.2;
  let startY = settings.textOffsetY * height;

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    if (settings.justifyText && line.includes(' ')) {
      textAlign(LEFT, CENTER);
      const words = line.trim().split(/\s+/);
      const totalW = words.reduce((sum, w) => sum + textWidth(w), 0);
      const availW = width - 40;
      const spacing = (availW - totalW) / (words.length - 1);
      let x = 20;
      words.forEach(w => {
        text(w, x, y);
        x += textWidth(w) + spacing;
      });
    } else {
      textAlign(CENTER, CENTER);
      text(line, settings.textOffsetX * width, y);
    }
  });
}

function draw() {
  background(20);

  if (settings.audioStarted) {
    fft.analyze();
    peakDetectors.bass.update(fft);
    peakDetectors.mid.update(fft);
    peakDetectors.treble.update(fft);

    const pd = peakDetectors[settings.freezeBand];
    if (pd.isDetected && settings.freezeMode === 'random') {
      if (!isFrozen && random() < settings.freezeProb) {
        isFrozen = true;
        console.log('🔒 Congelado');
      } else if (isFrozen && random() < settings.unfreezeProb) {
        isFrozen = false;
        console.log('🔓 Descongelado');
      }
      if (settings.textVisibilityMode === 'random' && random() < settings.textToggleProb) {
        isTextVisible = !isTextVisible;
      }
    }

    const energy = fft.getEnergy(settings.freezeBand);
    noStroke();
    fill(255);
    textSize(16);
    textAlign(LEFT, TOP);
    text(`Energía (${settings.freezeBand}): ${floor(energy)}`, 10, 10);
    fill(100, 200, 255, 180);
    rect(0, 30, map(energy, 0, 255, 0, width), 10);

  } else {
    noStroke();
    fill(255);
    textSize(18);
    textAlign(CENTER, CENTER);
    text('Pulsa "Iniciar Audio" para comenzar', width / 2, height / 2);
  }

  if (!isFrozen) {
    video.loadPixels();
    buffer.loadPixels();
    for (let i = 0; i < video.pixels.length; i += 4) {
      const idx = i / 4;
      const y = floor(idx / W);

      // fade previous
      buffer.pixels[i]     = max(buffer.pixels[i]     - FADE_AMOUNT, settings.blacksMin);
      buffer.pixels[i + 1] = max(buffer.pixels[i + 1] - FADE_AMOUNT, settings.blacksMin);
      buffer.pixels[i + 2] = max(buffer.pixels[i + 2] - FADE_AMOUNT, settings.blacksMin);

      // compute gray + contrast + exposure
      let gray = (video.pixels[i] + video.pixels[i + 1] + video.pixels[i + 2]) / 3;
      gray += settings.brightness;
      gray = ((gray - 128) * settings.contrast) + 128;
      gray = constrain(gray, 0, 255);

      if (y % 2 === 0) {
        gray *= settings.scanline;
        gray = constrain(gray, 0, 255);
      }

      const addVal = gray * settings.exposure;
      buffer.pixels[i]     = min(buffer.pixels[i]     + addVal, 255);
      buffer.pixels[i + 1] = min(buffer.pixels[i + 1] + addVal, 255);
      buffer.pixels[i + 2] = min(buffer.pixels[i + 2] + addVal, 255);
      buffer.pixels[i + 3] = 255;
    }
    buffer.updatePixels();
  }

  image(buffer, 0, 0, width, height);

  if (settings.textVisibilityMode === 'always') isTextVisible = true;
  else if (settings.textVisibilityMode === 'never') isTextVisible = false;

  drawCustomText();
}
