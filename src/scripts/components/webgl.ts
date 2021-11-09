import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import throttle from 'lodash.throttle';
import { isMobile } from './isMobile';
import { gsap } from 'gsap';

export default class WebGL {
    winSize: {
        [s: string]: number;
    };
    elms: {
        [s: string]: HTMLElement;
    };
    mvSubText: NodeListOf<HTMLElement>;
    dpr: number;
    three: {
        scene: THREE.Scene;
        renderer: THREE.WebGLRenderer | null;
        clock: THREE.Clock;
        camera: THREE.PerspectiveCamera | null;
        cameraFov: number;
        cameraAspect: number;
    };
    isMobile: boolean;
    meshOptions: Array<{
        obj: string;
        scale: {
            x: number;
            y: number;
            z: number;
        };
        position: {
            x: number;
            y: number;
            z: number;
        };
        rotation: {
            x: number;
            y: number;
            z: number;
        };
    }>;
    flg: {
        [s: string]: boolean;
    };
    constructor() {
        this.winSize = {
            wd: window.innerWidth,
            wh: window.innerHeight,
        };
        this.elms = {
            canvas: document.querySelector('[data-canvas]'),
            mvTitle: document.querySelector('[data-mv="title"]'),
            mvHomeLink: document.querySelector('[data-mv="homeLink"]'),
            mvNoteLink: document.querySelector('[data-mv="noteLink"]'),
            mvGitLink: document.querySelector('[data-mv="gitLink"]'),
        };
        this.mvSubText = document.querySelectorAll('.mv__sub-text');
        // デバイスピクセル比(最大値=2)
        this.dpr = Math.min(window.devicePixelRatio, 2);
        this.three = {
            scene: null,
            renderer: null,
            clock: null,
            camera: null,
            cameraFov: 50,
            cameraAspect: window.innerWidth / window.innerHeight,
        };
        this.isMobile = isMobile();
        // 読み込む3Dモデルの設定
        this.meshOptions = [
            {
                obj: './obj/ice.glb',
                scale: {
                    x: this.isMobile ? 0.4 : 0.7,
                    y: this.isMobile ? 0.4 : 0.7,
                    z: this.isMobile ? 0.4 : 0.7,
                },
                position: {
                    x: this.isMobile ? 1.3 : 5,
                    y: this.isMobile ? 2 : 2,
                    z: this.isMobile ? 1 : 1,
                },
                rotation: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
            },
            {
                obj: './obj/ice_chips.glb',
                scale: {
                    x: this.isMobile ? 0.5 : 0.7,
                    y: this.isMobile ? 0.5 : 0.7,
                    z: this.isMobile ? 0.5 : 0.7,
                },
                position: {
                    x: this.isMobile ? 1.4 : 6,
                    y: this.isMobile ? 0 : 0,
                    z: this.isMobile ? 0 : 0,
                },
                rotation: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
            },
            {
                obj: './obj/ice_chocolate.glb',
                scale: {
                    x: this.isMobile ? 0.5 : 0.7,
                    y: this.isMobile ? 0.5 : 0.7,
                    z: this.isMobile ? 0.5 : 0.7,
                },
                position: {
                    x: this.isMobile ? 1.3 : 5,
                    y: this.isMobile ? -2.4 : -3,
                    z: this.isMobile ? 1 : 1,
                },
                rotation: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
            },
            {
                obj: './obj/ice_macha.glb',
                scale: {
                    x: this.isMobile ? 0.5 : 0.7,
                    y: this.isMobile ? 0.5 : 0.7,
                    z: this.isMobile ? 0.5 : 0.7,
                },
                position: {
                    x: this.isMobile ? -1.3 : -5,
                    y: this.isMobile ? 2.4 : 2,
                    z: this.isMobile ? 1 : 1,
                },
                rotation: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
            },
            {
                obj: './obj/ice_spoon.glb',
                scale: {
                    x: this.isMobile ? 0.5 : 0.7,
                    y: this.isMobile ? 0.5 : 0.7,
                    z: this.isMobile ? 0.5 : 0.7,
                },
                position: {
                    x: this.isMobile ? -1.4 : -6,
                    y: this.isMobile ? 0 : 0,
                    z: this.isMobile ? 0 : 0,
                },
                rotation: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
            },
            {
                obj: './obj/ice_double.glb',
                scale: {
                    x: this.isMobile ? 0.5 : 0.7,
                    y: this.isMobile ? 0.5 : 0.7,
                    z: this.isMobile ? 0.5 : 0.7,
                },
                position: {
                    x: this.isMobile ? -1.3 : -5,
                    y: this.isMobile ? -2.4 : -3,
                    z: this.isMobile ? 1 : 1,
                },
                rotation: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
            },
        ];
        this.flg = {
            loaded: false,
        };
        this.init();
    }
    init(): void {
        this.initScene();
        this.initCamera();
        this.initClock();
        this.initRenderer();
        this.setLoading();
        this.setLight();
        this.handleEvents();
    }
    initScene(): void {
        // シーンを作成
        this.three.scene = new THREE.Scene();
    }
    initCamera(): void {
        // カメラを作成(視野角, スペクト比, near, far)
        this.three.camera = new THREE.PerspectiveCamera(this.three.cameraFov, this.winSize.wd / this.winSize.wh, this.three.cameraAspect, 1000);
        this.three.camera.position.set(0, 0, 9);
    }
    initClock(): void {
        // 時間計測用
        this.three.clock = new THREE.Clock();
    }
    initRenderer(): void {
        // レンダラーを作成
        this.three.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true, //背景色を設定しないとき、背景を透明にする
        });
        this.three.renderer.setPixelRatio(this.dpr); // retina対応
        this.three.renderer.setSize(this.winSize.wd, this.winSize.wh); // 画面サイズをセット
        this.three.renderer.physicallyCorrectLights = true;
        this.three.renderer.shadowMap.enabled = true; // シャドウを有効にする
        this.three.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // PCFShadowMapの結果から更に隣り合う影との間を線形補間して描画する
        this.elms.canvas.appendChild(this.three.renderer.domElement); // HTMLにcanvasを追加
        this.three.renderer.outputEncoding = THREE.GammaEncoding; // 出力エンコーディングを定義
    }
    setLight() {
        // 環境光源(色, 光の強さ)
        const ambientLight = new THREE.AmbientLight(0x666666);
        this.three.scene.add(ambientLight);

        const positionArr = [
            [0, 5, 0, 2],
            [-5, 3, 2, 2],
            [5, 3, 2, 2],
            [0, 3, 5, 1],
            [0, 3, -5, 2],
        ];

        for (let i = 0; i < positionArr.length; i++) {
            // 平行光源(色, 光の強さ)
            const directionalLight = new THREE.DirectionalLight(0xffffff, positionArr[i][3]);
            directionalLight.position.set(positionArr[i][0], positionArr[i][1], positionArr[i][2]);

            if (i == 0 || i == 2 || i == 3) {
                directionalLight.castShadow = true;
                directionalLight.shadow.camera.top = 50;
                directionalLight.shadow.camera.bottom = -50;
                directionalLight.shadow.camera.right = 50;
                directionalLight.shadow.camera.left = -50;
                directionalLight.shadow.mapSize.set(4096, 4096);
            }
            this.three.scene.add(directionalLight);
        }
    }
    setLoading() {
        // glTF形式の3Dモデルを読み込む
        const loader = new GLTFLoader();
        for (let i = 0; i < this.meshOptions.length; i++) {
            const m = this.meshOptions[i];
            const obj = m.obj;
            loader.load(obj, (data) => {
                const gltfData = data.scene;
                // サイズの設定
                gltfData.scale.set(m.scale.x, m.scale.y, m.scale.z);
                // 角度の設定
                gltfData.rotation.set(m.rotation.x, m.rotation.y, m.rotation.z);
                // 位置の設定
                gltfData.position.set(m.position.x, m.position.y, m.position.z);
                this.three.scene.add(gltfData);
                this.flg.loaded = true;
                // レンダリングを開始する
                this.rendering();
            });
        }
    }
    rendering(): void {
        // レンダリングを実行
        requestAnimationFrame(this.rendering.bind(this));
        this.three.renderer.render(this.three.scene, this.three.camera);
        this.animate(); // アニメーション開始
    }
    animate() {
        gsap.config({
            force3D: true,
        });
        const tl = gsap.timeline({
            paused: true,
            defaults: {
                duration: 0.6,
                ease: 'power2.easeOut',
            },
        });
        tl.to(this.elms.canvas, {
            duration: 1,
            opacity: 1,
        });
        tl.to(
            this.elms.mvTitle,
            {
                opacity: 1,
                y: 0,
            },
            1
        );
        tl.to(
            this.mvSubText,
            {
                opacity: 1,
                stagger: 0.05,
                y: 0,
            },
            1.5
        );
        tl.to(
            this.elms.mvHomeLink,
            {
                y: 0,
            },
            2.5
        );
        tl.to(
            this.elms.mvNoteLink,
            {
                y: 0,
            },
            2.5
        );
        tl.to(
            this.elms.mvGitLink,
            {
                y: 0,
            },
            2.5
        );
        tl.play();
    }
    handleEvents(): void {
        // リサイズイベント登録
        window.addEventListener(
            'resize',
            throttle(() => {
                this.handleResize();
            }, 100),
            false
        );
    }
    handleResize(): void {
        // リサイズ処理
        this.winSize = {
            wd: window.innerWidth,
            wh: window.innerHeight,
        };
        this.dpr = Math.min(window.devicePixelRatio, 2);
        if (this.three.camera) {
            // カメラの位置更新
            this.three.camera.aspect = this.winSize.wd / this.winSize.wh;
            this.three.camera.updateProjectionMatrix();
        }
        if (this.three.renderer) {
            // レンダラーの大きさ更新
            this.three.renderer.setSize(this.winSize.wd, this.winSize.wh);
            this.three.renderer.setPixelRatio(this.dpr);
        }
    }
}
