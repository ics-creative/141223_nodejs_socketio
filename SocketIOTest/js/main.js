// サーバーに接続
var socket = io.connect(location.origin);
// サーバーへデータを送信
socket.emit("dataName2", { fuga : "piyo"});
// サーバーからのデータを受信
socket.on("dataName1", function(dataFromServer) {
    // 「1」という数値がブラウザのコンソールに出力される。
    console.log(dataFromServer.hoge);
});
