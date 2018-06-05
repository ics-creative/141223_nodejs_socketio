var socket;
if (typeof(io) != "undefined") {
    socket = io.connect(location.origin);
} else {
    // ioオブジェクトが存在しない時にエラーにならない設定
    socket = {
        emit: function () {}, on: function () {}
    }
}

var roomID;
$(function () {
    var consoleText = $("#consoleText");
    var windowDom = $(window);
    var controllerWindow = $("#controllerWindow");
    var controllPoint = $("#controllPoint");
    var controllerWidth;
    var controllerHeight;
    var CONTROLLER_MARGIN = 10;

    // ペアリングボタンをタップしたら、ペアリングを開始
    $("#pairingButton").click(function () {
        startPairing();
    });

    // ペアリングに成功
    socket.on("successPairing", function () {
        showControllWindow();
        $("#pairingIDText").text("Paring ID:" + roomID);
    });

    // PCとのペアリングに失敗
    socket.on("failPairingWithPC", function () {
        $("#pairingButton").show();
        $("#paringMessage").hide();
    });

    // ウィンドウのリサイズ
    windowDom.resize(resizeHandler);
    resizeHandler();

    // debug
    //socket.emit("pairingFromController", {
    //    "roomID": 1
    //});

    $("#room")
    function startPairing() {
        $("#pairingButton").hide();
        $("#paringMessage").show();

        roomID = $("#roomID").val();
        socket.emit("pairingFromController", {
            "roomID": roomID
        });
    }

    function showControllWindow() {
        $("#pairingWindow").animate({
            "top": "0"
        }, "1s", "swing");

        $("#pairingWindow").remove();
        controllerWindow.animate({
            "top": "50%"
        }, "1s", "swing");
    }

    function resizeHandler() {
        controllerWidth = windowDom.width() - CONTROLLER_MARGIN * 2;
        controllerHeight = windowDom.height() - CONTROLLER_MARGIN * 2;
        controllerWindow.css({
            "width": controllerWidth + "px", "height": controllerHeight + "px", "margin-left": "-" + controllerWidth / 2 + "px", "margin-top": "-" + controllerHeight / 2 + "px"
        })
    }

    if ("ontouchstart" in window) {
        var isTouch = true;
        var MOUSE_DOWN = "touchstart";
        var MOUSE_UP = "touchend";
        var MOUSE_MOVE = "touchmove";
        var MOUSE_OUT = "touchout";
    } else {
        var isTouch = false;
        var MOUSE_DOWN = "mousedown";
        var MOUSE_UP = "mouseup";
        var MOUSE_MOVE = "mousemove";
        var MOUSE_OUT = "mouseleave";
    }

    var isDrag = false;
    var lastIsDrag = false;

    $(document).on(MOUSE_DOWN, function (mouseEvent) {
        isDrag = true;
        mouseActionHandler(mouseEvent, "mouseDownFromControler");
    });

    $(document).on(MOUSE_MOVE, function (mouseEvent) {
        event.preventDefault();
        if (isDrag) {
            mouseActionHandler(mouseEvent, "mouseMoveFromControler");
        }
    });

    $(document).on(MOUSE_UP + " " + MOUSE_OUT, function (mouseEvent) {
        isDrag = false;
        mouseActionHandler(mouseEvent, "mouseUpFromControler");
    });

    /**
     * マウスのアクションがあった時に実行される
     * マウスイベントを受け取って、emitEventNameというデータをサーバーに送信する
     */
    function mouseActionHandler(mouseEvent, emitEventName) {
        var eventX = (!isTouch) ? mouseEvent.pageX : event.changedTouches[0].pageX;
        var eventY = (!isTouch) ? mouseEvent.pageY : event.changedTouches[0].pageY;
        // 座標の正規化
        var uvx = (eventX - CONTROLLER_MARGIN) / controllerWidth;
        var uvy = (eventY - CONTROLLER_MARGIN) / controllerHeight;
        // サーバーに送信
        socket.emit(emitEventName, {
            "eventUVX": uvx, "eventUVY": uvy
        });

        if (!isDrag) {
            if (controllPoint.hasClass("on")) {
                controllPoint.removeClass("on");
            }
        } else {
            if (!controllPoint.hasClass("on")) {
                controllPoint.addClass("on");
            }
            controllPoint.css({
                left: eventX - 40 + "px", top: eventY - 40 + "px"
            });
        }
    }
});
