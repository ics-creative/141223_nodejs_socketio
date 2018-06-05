let socket;
if (typeof(io) != 'undefined') {
  socket = io.connect(location.origin);
} else {
  // ioオブジェクトが存在しない時にエラーにならない設定
  socket = {
    emit: () => {
    },
    on: () => {
    }
  };
}

let roomID;
$(function () {
  const windowDom = $(window);
  const controllerWindow = $('#controllerWindow');
  const controllPoint = $('#controllPoint');
  let controllerWidth;
  let controllerHeight;
  const CONTROLLER_MARGIN = 10;

  // ペアリングボタンをタップしたら、ペアリングを開始
  $('#pairingButton').click(function () {
    startPairing();
  });

  // ペアリングに成功
  socket.on('successPairing', function () {
    showControllWindow();
    $('#pairingIDText').text('Paring ID:' + roomID);
  });

  // PCとのペアリングに失敗
  socket.on('failPairingWithPC', function () {
    $('#pairingButton').show();
    $('#paringMessage').hide();
  });

  // ウィンドウのリサイズ
  windowDom.resize(resizeHandler);
  resizeHandler();

  // debug
  //socket.emit("pairingFromController", {
  //    "roomID": 1
  //});

  $('#room');

  function startPairing() {
    $('#pairingButton').hide();
    $('#paringMessage').show();

    roomID = $('#roomID').val();
    socket.emit('pairingFromController', {
      'roomID': roomID
    });
  }

  function showControllWindow() {
    $('#pairingWindow').animate({
      'top': '0'
    }, '1s', 'swing');

    $('#pairingWindow').remove();
    controllerWindow.animate({
      'top': '50%'
    }, '1s', 'swing');
  }

  function resizeHandler() {
    controllerWidth = windowDom.width() - CONTROLLER_MARGIN * 2;
    controllerHeight = windowDom.height() - CONTROLLER_MARGIN * 2;
    controllerWindow.css({
      'width': controllerWidth + 'px',
      'height': controllerHeight + 'px',
      'margin-left': '-' + controllerWidth / 2 + 'px',
      'margin-top': '-' + controllerHeight / 2 + 'px'
    });
  }

  const isTouch = ('ontouchstart' in window);
  const MOUSE_DOWN = isTouch ? 'touchstart' : 'mousedown';
  const MOUSE_UP = isTouch ? 'touchend' : 'mouseup';
  const MOUSE_MOVE = isTouch ? 'touchmove' : 'mousemove';
  const MOUSE_OUT = isTouch ? 'touchout' : 'mouseleave';

  let isDrag = false;

  $(document).on(MOUSE_DOWN, (mouseEvent) => {
    isDrag = true;
    mouseActionHandler(mouseEvent, 'mouseDownFromControler');
  });

  $(document).on(MOUSE_MOVE, (mouseEvent) => {
    event.preventDefault();
    if (isDrag) {
      mouseActionHandler(mouseEvent, 'mouseMoveFromControler');
    }
  });

  $(document).on(MOUSE_UP + ' ' + MOUSE_OUT, (mouseEvent) => {
    isDrag = false;
    mouseActionHandler(mouseEvent, 'mouseUpFromControler');
  });

  /**
   * マウスのアクションがあった時に実行される
   * マウスイベントを受け取って、emitEventNameというデータをサーバーに送信する
   */
  function mouseActionHandler(mouseEvent, emitEventName) {
    const eventX = (!isTouch) ? mouseEvent.pageX : event.changedTouches[0].pageX;
    const eventY = (!isTouch) ? mouseEvent.pageY : event.changedTouches[0].pageY;
    // 座標の正規化
    const uvx = (eventX - CONTROLLER_MARGIN) / controllerWidth;
    const uvy = (eventY - CONTROLLER_MARGIN) / controllerHeight;
    // サーバーに送信
    socket.emit(emitEventName, {
      'eventUVX': uvx, 'eventUVY': uvy
    });

    if (!isDrag) {
      if (controllPoint.hasClass('on')) {
        controllPoint.removeClass('on');
      }
    } else {
      if (!controllPoint.hasClass('on')) {
        controllPoint.addClass('on');
      }
      controllPoint.css({
        left: eventX - 40 + 'px', top: eventY - 40 + 'px'
      });
    }
  }
});
