var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../libs/easeljs.d.ts"/>
// Socket.IOを使って接続
var socket = io.connect(location.origin);

// ランダムなルームIDを作成
var roomID = Math.floor(Math.random() * 10000);

// パーティクルのスタート色
var particleColor = Math.floor(Math.random() * 360);

// roomIDに入室
socket.emit("pairingFromMain", { "roomID": roomID });

$(function () {
    $("#pairingCodeForSP").text(roomID);

    // サーバーからsuccessPairingというデータを受信
    socket.on("successPairing", loginSuccessHandler);

    // サーバーからsuccessForceLoginPCというデータを受信
    socket.on("successForceLoginPC", loginSuccessHandler);

    var pairingLayer = $("#pairingLayer");
    var forcePairingLayer = $("#forcePairingLayer");
    $("#forcePairingText").click(function () {
        switchLayer(forcePairingLayer, pairingLayer);
    });
    $("#normalPairingText").click(function () {
        switchLayer(pairingLayer, forcePairingLayer);
    });

    // ペアリングボタンをタップしたら、roomIDを送信
    $("#pairingButton").click(function () {
        roomID = $("#roomID").val();

        // サーバーにforcePairingFromMainというデータを送信
        socket.emit("forcePairingFromMain", {
            "roomID": roomID
        });
    });

    function loginSuccessHandler() {
        $("#pairingIDText").text("Paring ID:" + roomID);

        pairingLayer.add(forcePairingLayer).animate({
            "top": "-50%"
        }, "1s", "swing", function () {
            pairingLayer.add(forcePairingLayer).remove();
            $("#myCanvasLayer").fadeIn();
        });
    }

    function switchLayer(layer, hideLayer, callBack) {
        hideLayer.animate({
            "top": "-50%"
        }, "1s", "swing", function () {
            layer.animate({
                "top": "50%"
            }, "1s", "swing", function () {
                if (callBack) {
                    callBack();
                }
            });
        });
    }
});

window.onload = function () {
    var main = new demo.Main();

    // サーバーからmouseDownToMainというデータを受信
    // コントローラーのマウスダウンイベントがサーバーを経由してメイン画面に届いた
    socket.on("mouseDownToMain", function (data) {
        main.handleMouseDown(data);
    });

    // サーバーからmouseMoveToMainというデータを受信
    // コントローラーのマウスムーブイベントがサーバーを経由してメイン画面に届いた
    socket.on("mouseMoveToMain", function (data) {
        main.handleMouseMove(data);
    });

    // サーバーからmmouseUpToMainというデータを受信
    // コントローラーのマウスアップイベントがサーバーを経由してメイン画面に届いた
    socket.on("mouseUpToMain", function (data) {
        main.handleMouseUp(data);
    });
};

/**
* パーティクルデモのメインクラスです。
* @class project.Main
*/
var demo;
(function (demo) {
    var Main = (function () {
        /**
        * @constructor
        */
        function Main() {
            var _this = this;
            // 初期設定
            this.stage = new createjs.Stage(document.getElementById("myCanvas"));

            if (createjs.Touch.isSupported()) {
                createjs.Touch.enable(this.stage);
            }

            // パーティクルサンプルを作成
            this.sample = new ParticleSample();
            this.stage.addChild(this.sample);

            // Tickerを作成
            createjs.Ticker.timingMode = createjs.Ticker.RAF;
            createjs.Ticker.addEventListener("tick", function () {
                _this.handleTick();
            });

            // リサイズイベント
            this.handleResize();
            window.addEventListener("resize", function () {
                _this.handleResize();
            });
        }
        Main.prototype.handleMouseDown = function (data) {
            this.sample.changeEmitPosition(data);
            this.sample.mouseDown();
        };

        Main.prototype.handleMouseMove = function (data) {
            this.sample.changeEmitPosition(data);
        };

        Main.prototype.handleMouseUp = function (data) {
            this.sample.changeEmitPosition(data);
            this.sample.mouseUp();
        };

        /**
        * エンターフレームイベント
        */
        Main.prototype.handleTick = function () {
            // create residual image effect
            this.stage.update();
        };

        /**
        * リサイズイベント
        */
        Main.prototype.handleResize = function () {
            this.stage.canvas.width = window.innerWidth;
            this.stage.canvas.height = window.innerHeight;
        };
        return Main;
    })();
    demo.Main = Main;

    /**
    * 大量のパーティクルを発生させてみた
    * マウスを押してる間でてくるよ
    * @see http://wonderfl.net/c/4WjT
    * @class demo.ParticleSample
    */
    var ParticleSample = (function (_super) {
        __extends(ParticleSample, _super);
        function ParticleSample() {
            var _this = this;
            _super.call(this);
            this._count = 0;
            this._bg = new createjs.Shape();
            this.addChild(this._bg);

            this._emitter = new ParticleEmitter();
            this.addChild(this._emitter.container);

            this._emitX = 0;
            this._emitY = 0;
            this._shadow = new createjs.Bitmap("images/Shadow.jpg");
            this.addChildAt(this._shadow, 0);

            this.on("tick", this.enterFrameHandler, this);
            this.handleResize();
            window.addEventListener("resize", function () {
                _this.handleResize();
            });
        }
        /**
        * エンターフレームイベント
        * @param event
        */
        ParticleSample.prototype.enterFrameHandler = function (event) {
            this._emitter.latestX = this._emitX;
            this._emitter.latestY = this._emitY;
            this._emitter.update();
        };

        ParticleSample.prototype.changeEmitPosition = function (eventData) {
            var uvx = eventData.eventUVX;
            var uvy = eventData.eventUVY;

            this._emitX = window.innerWidth * uvx;
            this._emitY = window.innerHeight * uvy;
        };

        ParticleSample.prototype.mouseDown = function () {
            this._emitter.latestX = this._emitX;
            this._emitter.latestY = this._emitY;

            this._eventMouseDown = this.on("tick", this.createParticle, this);
            this._isDown = true;
        };

        ParticleSample.prototype.mouseUp = function () {
            this.off("tick", this._eventMouseDown);
            this._isDown = false;
        };

        ParticleSample.prototype.createParticle = function (event) {
            if (this._isDown)
                this._emitter.emit(this._emitX, this._emitY);
        };

        ParticleSample.prototype.handleResize = function () {
            this._shadow.scaleX = (window.innerWidth / 1024);
            this._shadow.scaleY = (window.innerHeight / 1024);
        };
        return ParticleSample;
    })(createjs.Container);

    /**
    * パーティクル発生装置。マウス座標から速度を計算する。
    * @class project.Emitter
    */
    var Emitter = (function () {
        /**
        * @constructor
        */
        function Emitter() {
            this.vy = 0;
            this.vx = 0;
            this.x = 0;
            this.y = 0;
            this.latestX = 0;
            this.latestY = 0;
        }
        /**
        * パーティクルエミッターの計算を行います。この計算によりマウスの引力が計算されます。
        * @method
        */
        Emitter.prototype.update = function () {
            var dx = this.latestX - this.x;
            var dy = this.latestY - this.y;
            var d = Math.sqrt(dx * dx + dy * dy) * 0.2;
            var rad = Math.atan2(dy, dx);

            this.vx += Math.cos(rad) * d;
            this.vy += Math.sin(rad) * d;

            this.vx *= 0.4;
            this.vy *= 0.4;

            this.x += this.vx;
            this.y += this.vy;
        };
        return Emitter;
    })();

    /**
    * パーティクルエミッター
    * @class project.ParticleEmitter
    */
    var ParticleEmitter = (function (_super) {
        __extends(ParticleEmitter, _super);
        /**
        * @constructor
        */
        function ParticleEmitter() {
            _super.call(this);

            this.numParticles = 3;
            this.PRE_CACHE_PARTICLES = 300;

            this.container = new createjs.Container();

            this._particleActive = [];
            this._particlePool = [];

            for (var i = 0; i < this.PRE_CACHE_PARTICLES; i++) {
                this._particlePool.push(new Particle());
            }
        }
        /**
        * パーティクルを発生させます。
        * @param {number} x パーティクルの発生座標
        * @param {number} y パーティクルの発生座標
        * @method
        */
        ParticleEmitter.prototype.emit = function (x, y) {
            for (var i = 0; i < this.numParticles; i++) {
                this.getNewParticle(x, y);
            }
        };

        /**
        * パーティクルを更新します。
        * @method
        */
        ParticleEmitter.prototype.update = function () {
            _super.prototype.update.call(this);

            for (var i = 0; i < this._particleActive.length; i++) {
                var p = this._particleActive[i];
                if (!p.getIsDead()) {
                    if (p.x >= window.innerWidth) {
                        p.vx *= -0.5;
                        p.x = window.innerWidth;
                    } else if (p.x <= 0) {
                        p.vx *= -0.5;
                        p.x = 0;
                    }
                    p.update();
                } else {
                    this.removeParticle(p);
                }
            }
        };

        /**
        * パーティクルを追加します。
        * @param {THREE.Vector3} emitPoint
        * @method
        */
        ParticleEmitter.prototype.getNewParticle = function (emitX, emitY) {
            var p = new Particle();
            p.resetParameters(this.x, this.y, this.vx, this.vy);
            this._particleActive.push(p);
            this.container.addChild(p);
            return p;
        };

        /**
        * パーティクルを削除します。
        * @param {Particle} particle
        * @method
        */
        ParticleEmitter.prototype.removeParticle = function (p) {
            this.container.removeChild(p);

            var index = this._particleActive.indexOf(p);
            if (index > -1) {
                this._particleActive.splice(index, 1);
            }

            this.toPool(p);
        };

        /**
        * アクティブなパーティクルを取り出します。
        * @returns {project.Particle[]}
        * @method
        */
        ParticleEmitter.prototype.getActiveParticles = function () {
            return this._particleActive;
        };

        /**
        * プールにインスタンスを格納します。
        * @param {project.Particle}
        * @method
        */
        ParticleEmitter.prototype.toPool = function (particle) {
            this._particlePool.push(particle);
        };
        return ParticleEmitter;
    })(Emitter);

    /**
    * @class demo.Particle
    */
    var Particle = (function (_super) {
        __extends(Particle, _super);
        /**
        * コンストラクタ
        * @constructor
        */
        function Particle() {
            _super.call(this);
            this.rotation = Math.random() * 360;
            this.size = 20 + Math.random() * 40;
            var colorHsl = createjs.Graphics.getHSL(new Date().getTime() / 40 + Math.random() * 4 + particleColor, 100 + Math.random() * 4, 50 + Math.random() * 4);

            this.graphics.clear();
            this.graphics.beginRadialGradientFill([colorHsl, "#000000"], [0.0, 1.0], 0, 0, this.size / 2, 0, 0, this.size);
            this.graphics.drawCircle(0, 0, this.size);
            this.graphics.endFill();
            this.compositeOperation = "lighter";
            this.mouseEnabled = false;
            var padding = 2;
            this.cache(-this.size - padding, -this.size - padding, this.size * 2 + padding * 2, this.size * 2 + padding * 2);
            this._destroy = true;
        }
        /**
        * パーティクルをリセットします。
        * @param {createjs.Point} point
        * @param {number} vx
        * @param {number} vy
        */
        Particle.prototype.resetParameters = function (emitX, emitY, vx, vy) {
            this.x = emitX;
            this.y = emitY;
            this.vx = vx * 0.5 + (Math.random() - 0.5) * 10;
            this.vy = vy * 0.5 + (Math.random() - 0.7) * 10;
            this.life = Math.random() * 60 + 4;
            this._count = 0;
            this._destroy = false;
            this.alpha = 1.0;
            this.scaleX = this.scaleY = 1.0;
        };

        /**
        * パーティクル個別の内部計算を行います。
        * @method
        */
        Particle.prototype.update = function () {
            this.vy -= 0.5;
            this.x += this.vx;
            this.y += this.vy;
            this._count++;
            var maxD = (1 - this._count / this.life / 2);
            this.alpha = Math.random() * 0.6 + 0.4;
            this.scaleX = this.scaleY = maxD;

            // 死亡フラグ
            if (this.life < this._count) {
                this._destroy = true;
                this.parent.removeChild(this);
            }
        };

        /**
        * パーティクルが死んでいるかどうかを確認します。
        * @returns {boolean}
        * @method
        */
        Particle.prototype.getIsDead = function () {
            return this._destroy;
        };
        return Particle;
    })(createjs.Shape);
})(demo || (demo = {}));
//# sourceMappingURL=main.js.map
