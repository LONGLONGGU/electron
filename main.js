const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron');
//electron
const electron = require('electron');
const path = require('path');
//用一个 Tray 来表示一个图标,这个图标处于正在运行的系统的通知区 ，通常被添加到一个 context menu 上.
const Menu = electron.Menu;
const Tray = electron.Tray;
//托盘对象
var appTray = null;
let win;
let trayIcon;
var time = null;
var flashTrayTimer = null;
let windowConfig = {
  width: 1080,
  height: 720,
  webPreferences: {
    nodeIntegration: true, // 是否集成 Nodejs,把之前预加载的js去了，发现也可以运行
  }
};

ipcMain.on('message', (event, arg) => {
  console.log(event)
  console.log(arg)
  flashing(true);
})

ipcMain.on('stop', (event, arg) => {
  console.log(event)
  console.log(arg)
  flashing(false);
})

function createWindow() {
  win = new BrowserWindow(windowConfig);
  // win.loadURL(`file://${__dirname}/dist/index.html`);
  win.loadURL(`file://${__dirname}/index2.html`);
  //开启调试工具  
  win.webContents.openDevTools();

  //系统托盘右键菜单
  var trayMenuTemplate = [{
      label: '停止闪烁',
      click: function () {
        console.log("1231231")
        //系统托盘图标闪烁
        flashing(false);
      } //打开相应页面
    },
    {
      label: '开始闪烁',
      click: function () {
        flashing(true);
      }
    },
    {
      label: '关于',
      click: function () {}
    },
    {
      label: '退出',
      click: function () {
        app.quit();
        app.quit(); //因为程序设定关闭为最小化，所以调用两次关闭，防止最大化时一次不能关闭的情况
      }
    }
  ];

  //系统托盘图标目录
  trayIcon = path.join(__dirname, 'app'); //app是选取的目录

  appTray = new Tray(path.join(trayIcon, 'app.png')); //app.ico是app目录下的ico文件
  //图标的上下文菜单
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

  //设置此托盘图标的悬停提示内容
  appTray.setToolTip('我的托盘图标');

  //设置此图标的上下文菜单
  appTray.setContextMenu(contextMenu);
  //单击右下角小图标显示应用
  appTray.on('click', function () {
    win.show();
  })

  win.on('close', (e) => {
    //回收BrowserWindow对象
    if (win.isMinimized()) {
      win = null;
    } else {
      e.preventDefault();
      win.minimize();
    }
  });
  /*win.on('resize',() => {  
        win.reload();  
    })*/


}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (win == null) {
    createWindow();
  }
})
/**
 * 托盘图标闪烁
 * @param flash true：闪烁；false：停止
 */
function flashing(flash) {
  //系统托盘图标闪烁
  if (flash) {
    if (flashTrayTimer) {
      return;
    }
    var count = 0;
    flashTrayTimer = setInterval(() => {
      count++;
      if (count % 2 == 0) {

        appTray.setImage(path.join(trayIcon, '1.png'))
      } else {
        appTray.setImage(path.join(trayIcon, '0.png'))
      }
      // var audio = new Audio("./aa.mp3"); //这里的路径写上mp3文件在项目中的绝对路径
      // audio.play(); //播放
    }, 500);
  } else {
    if (flashTrayTimer) {
      clearInterval(flashTrayTimer);
      flashTrayTimer = null
    }
    appTray.setImage(path.join(trayIcon, 'app.png'))
  }
}

//playAudio
function playAudio() {
  var audio = new Audio("./aa.mp3");
  audio.play();
  setTimeout(function () {
    console.log("暂停播放....");
    audio.pause(); // 暂停
  }, 800)
}