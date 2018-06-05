// httpモジュールの読み込み
const http = require('http');
// fsモジュールの読み込み
const fs = require('fs');
// pathモジュールの読み込み
const path = require('path');
// httpサーバーを立てる
const server = http.createServer(requestListener);
// httpサーバーを起動する。
server.listen((process.env.PORT || 5000), function () {
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

// サーバーへのアクセスを監視。アクセスがあったらコールバックが実行
io.sockets.on('connection', function (socket) {
  const dataToClient = {hoge: 1};   // クライアントに送信するデータ
  // 接続元のクライアントだけにデータ送信。
  socket.emit('dataName1', dataToClient);
  // 接続元のクライアント以外にデータ送信
  socket.broadcast.emit('dataName1', dataToClient);

  // クライアントからのデータの受信
  socket.on('dataName2', function (dataFromClient) {
    // 「piyo」という文字列がターミナルに出力される。
    console.log(dataFromClient.fuga);
  });
});
