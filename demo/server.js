// サーバー構築
const http = require('http');
// fsモジュールの読み込み
const fs = require('fs');
// pathモジュールの読み込み
const path = require('path');
// httpサーバーを立てる
const server = http.createServer(requestListener);
// httpサーバーを起動する。
server.listen((process.env.PORT || 5000), () => {
  console.log((process.env.PORT || 5000) + 'でサーバーが起動しました');
});

/**
 * サーバーにリクエストがあった際に実行される関数
 */
function requestListener(request, response) {
  // リクエストがあったファイル
  const requestURL = request.url;
  // リクエストのあったファイルの拡張子を取得
  const extensionName = path.extname(requestURL);
  // ファイルの拡張子に応じてルーティング処理
  switch (extensionName) {
    case '.html':
      readFileHandler(requestURL, 'text/html', false, response);
      break;
    case '.css':
      readFileHandler(requestURL, 'text/css', false, response);
      break;
    case '.js':
    case '.ts':
      readFileHandler(requestURL, 'text/javascript', false, response);
      break;
    case '.png':
      readFileHandler(requestURL, 'image/png', true, response);
      break;
    case '.jpg':
      readFileHandler(requestURL, 'image/jpeg', true, response);
      break;
    case '.gif':
      readFileHandler(requestURL, 'image/gif', true, response);
      break;
    default:
      // どこにも該当しない場合は、index.htmlを読み込む
      readFileHandler('/index.html', 'text/html', false, response);
      break;
  }
}

/**
 * ファイルの読み込み
 */
function readFileHandler(fileName, contentType, isBinary, response) {
  // エンコードの設定
  const encoding = !isBinary ? 'utf8' : 'binary';
  const filePath = __dirname + fileName;

  fs.exists(filePath, function (exits) {
    if (exits) {
      fs.readFile(filePath, {encoding: encoding}, function (error, data) {
        if (error) {
          response.statusCode = 500;
          response.end('Internal Server Error');
        } else {
          response.statusCode = 200;
          response.setHeader('Content-Type', contentType);
          if (!isBinary) {
            response.end(data);
          }
          else {
            response.end(data, 'binary');
          }
        }
      });
    }
    else {
      // ファイルが存在しない場合は400エラーを返す。
      response.statusCode = 400;
      response.end('400 Error');
    }
  });
}

// socket.ioの読み込み
const socketIO = require('socket.io');
// サーバーでSocket.IOを使える状態にする
const io = socketIO.listen(server);

// サーバーへのアクセスを監視。クライアントからのアクセスがあったらコールバックが実行
io.sockets.on('connection', (socket) => {
  let roomID;
  // メイン画面からのpairingFromMainというデータを受信（メイン画面のペアリング）
  socket.on('pairingFromMain', (data) => {
    roomID = data.roomID;
    socket.join(roomID);
    socket.emit('successLoginPC');
  });
  // メイン画面からのforcePairingFromMainというデータを受信（強制ペアリング）
  socket.on('forcePairingFromMain', (data) => {
    roomID = data.roomID;
    socket.join(roomID);
    socket.emit('successPairing');
  });
  // コントローラーからのpairingFromControllerというデータを受信（コントローラーのペアリングイベント）
  socket.on('pairingFromController', (data) => {
    roomID = data.roomID;
    socket.join(roomID);
    // ルームIDがroomIDのグループにsuccessPairingというデータを送信
    io.sockets.to(roomID).emit('successPairing');
  });
  // コントローラーからmouseDownFromControlerというデータを受信（コントローラでマウスダウンイベントが発生）
  socket.on('mouseDownFromControler', (data) => {
    socket.to(roomID).broadcast.emit('mouseDownToMain', data);
  });
  // コントローラーからmouseMoveFromControlerというデータを受信（コントローラでマウスムーブイベントが発生）
  socket.on('mouseMoveFromControler', (data) => {
    socket.to(roomID).broadcast.emit('mouseMoveToMain', data);
  });
  // コントローラーからmouseUpFromControlerというデータを受信（コントローラでマウスアップイベントが発生）
  socket.on('mouseUpFromControler', (data) => {
    socket.to(roomID).broadcast.emit('mouseUpToMain', data);
  });
});
// 接続エラー
io.sockets.on('connect_error', (socket) => {
  console.log('connect_error');
});
// 接続終了
io.sockets.on('disconnect', (socket) => {
  socket.emit('disconnectEvent');
  console.log('disconnecth');
});
