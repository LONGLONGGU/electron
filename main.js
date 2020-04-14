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
  width: 1920,
  height: 1080,
  webPreferences: {
    nodeIntegration: true, // 是否集成 Nodejs,把之前预加载的js去了，发现也可以运行
  }
};
let template = [{
  label: '编辑',
  submenu: [{
    label: '撤销',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: '重做',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo'
  }, {
    type: 'separator'
  }, {
    label: '剪切',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut'
  }, {
    label: '复制',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: '粘贴',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    label: '全选',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall'
  }]
}, {
  label: '查看',
  submenu: [{
    label: '重载',
    accelerator: 'CmdOrCtrl+R',
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        // 重载之后, 刷新并关闭所有的次要窗体
        if (focusedWindow.id === 1) {
          BrowserWindow.getAllWindows().forEach(function (win) {
            if (win.id > 1) {
              win.close()
            }
          })
        }
        focusedWindow.reload()
      }
    }
  }, {
    label: '切换全屏',
    accelerator: (function () {
      if (process.platform === 'darwin') {
        return 'Ctrl+Command+F'
      } else {
        return 'F11'
      }
    })(),
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
      }
    }
  }, {
    label: '切换开发者工具',
    accelerator: (function () {
      if (process.platform === 'darwin') {
        return 'Alt+Command+I'
      } else {
        return 'Ctrl+Shift+I'
      }
    })(),
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.toggleDevTools()
      }
    }
  }, {
    type: 'separator'
  }, {
    label: '应用程序菜单演示',
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        const options = {
          type: 'info',
          title: '应用程序菜单演示',
          buttons: ['好的'],
          message: '此演示用于 "菜单" 部分, 展示如何在应用程序菜单中创建可点击的菜单项.'
        }
        electron.dialog.showMessageBox(focusedWindow, options, function () {})
      }
    }
  }]
}, {
  label: '窗口',
  role: 'window',
  submenu: [{
    label: '最小化',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  }, {
    label: '关闭',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }, {
    type: 'separator'
  }, {
    label: '重新打开窗口',
    accelerator: 'CmdOrCtrl+Shift+T',
    enabled: false,
    key: 'reopenMenuItem',
    click: function () {
      app.emit('activate')
    }
  }]
}, {
  label: '帮助',
  role: 'help',
  submenu: [{
    label: '学习更多',
    click: function () {
      electron.shell.openExternal('http://electron.atom.io')
    }
  }]
}]

function addUpdateMenuItems(items, position) {
  if (process.mas) return

  const version = electron.app.getVersion()
  let updateItems = [{
    label: `Version ${version}`,
    enabled: false
  }, {
    label: '正在检查更新',
    enabled: false,
    key: 'checkingForUpdate'
  }, {
    label: '检查更新',
    visible: false,
    key: 'checkForUpdate',
    click: function () {
      require('electron').autoUpdater.checkForUpdates()
    }
  }, {
    label: '重启并安装更新',
    enabled: true,
    visible: false,
    key: 'restartToUpdate',
    click: function () {
      require('electron').autoUpdater.quitAndInstall()
    }
  }]

  items.splice.apply(items, [position, 0].concat(updateItems))
}

function findReopenMenuItem() {
  const menu = Menu.getApplicationMenu()
  if (!menu) return

  let reopenMenuItem
  menu.items.forEach(function (item) {
    if (item.submenu) {
      item.submenu.items.forEach(function (item) {
        if (item.key === 'reopenMenuItem') {
          reopenMenuItem = item
        }
      })
    }
  })
  return reopenMenuItem
}

if (process.platform === 'darwin') {
  const name = electron.app.getName()
  template.unshift({
    label: name,
    submenu: [{
      label: `关于 ${name}`,
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: '服务',
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: `隐藏 ${name}`,
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: '隐藏其它',
      accelerator: 'Command+Alt+H',
      role: 'hideothers'
    }, {
      label: '显示全部',
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      label: '退出',
      accelerator: 'Command+Q',
      click: function () {
        app.quit()
      }
    }]
  })
  // 窗口菜单.
  template[3].submenu.push({
    type: 'separator'
  }, {
    label: '前置所有',
    role: 'front'
  })

  addUpdateMenuItems(template[0].submenu, 1)
}

if (process.platform === 'win32') {
  const helpMenu = template[template.length - 1].submenu
  addUpdateMenuItems(helpMenu, 0)
}

app.on('ready', function () {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})

app.on('browser-window-created', function () {
  let reopenMenuItem = findReopenMenuItem()
  if (reopenMenuItem) reopenMenuItem.enabled = false
})

app.on('window-all-closed', function () {
  let reopenMenuItem = findReopenMenuItem()
  if (reopenMenuItem) reopenMenuItem.enabled = true
})
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
  win.loadURL(`file://${__dirname}/dist/index.html`);
  // win.loadURL(`file://${__dirname}/index2.html`);
  //开启调试工具  
  // win.webContents.openDevTools();

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