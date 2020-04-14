// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
//渲染进程

const {
  ipcRenderer
} = require('electron') //nodejs的commonjs进行导入导出

var btn = document.getElementById('btn_start')
btn.addEventListener("click", send);

function send() {
  ipcRenderer.send('message');
  playAudio()
  console.log("开始执行");
}
var btn = document.getElementById('btn_stop')
btn.addEventListener("click", stop);

function stop() {
  ipcRenderer.send('stop');
  console.log("开始执行");
}

function playAudio() {
  var audio = new Audio("./aa.mp3");
  audio.play();
  setTimeout(function () {
    console.log("暂停播放....");
    audio.pause(); // 暂停
  }, 800)
}