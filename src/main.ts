const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

function drawTriangle() {
  // just draw a random triangle
  ctx.fillStyle = 'red'
  ctx.beginPath()
  ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
  ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
  ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
  ctx.closePath()
  ctx.fill()
}

function onFrame() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < 10; i++) {
    drawTriangle()
  }
}

function onFrameCallbackLoop() {
  onFrame()
  requestAnimationFrame(onFrameCallbackLoop)
}

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  // onFrame() ?? not sure if this is needed
}

window.addEventListener('resize', resizeCanvas)
resizeCanvas() // initialise canvas size

onFrameCallbackLoop() // start the animation loop
