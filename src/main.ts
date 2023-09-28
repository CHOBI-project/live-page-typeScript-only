import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Ring, positionArray } from './torus_position';
import { CommentArr, commentArray } from './message';

//torusのtexture
// import a from './images/a.jpg'; //
import b from './images/b.jpg'; //レンガ
// import c from './images/c.jpg'; //
// import d from './images/d.jpg'; //三角図形
// import e from './images/e.jpg'; //網目状1
// import f from './images/f.jpg'; //網目状2

const canvas: HTMLCanvasElement  = <HTMLCanvasElement>document.getElementById('canvas');
const bt    : HTMLButtonElement  = <HTMLButtonElement>document.getElementById('bt');
const latOut: HTMLSpanElement    = <HTMLSpanElement>document.getElementById('lat');
const lngOut: HTMLSpanElement    = <HTMLSpanElement>document.getElementById('lng');
const timer : HTMLDivElement     = <HTMLDivElement>document.getElementById('timer');
const commentBox: HTMLDivElement = <HTMLDivElement>document.getElementById('commentBox');
const lastUpdate: HTMLDivElement = <HTMLDivElement>document.getElementById('last-update');

function init() {

  //Geolocation
  function getGeolocation() {
    navigator.geolocation.getCurrentPosition((position) => {
      let lat  = position.coords.latitude;
      let long = position.coords.longitude;
  
      latOut.innerText = String(lat);
      lngOut.innerText = String(long);
    });
  }
  getGeolocation();


  //timer
  function timeData() {
    const date         = new Date();
    const year         = date.getFullYear();
    const month        = date.getMonth() + 1;
    const day          = date.getDate();
    const hour         = date.getHours().toString().padStart(2, "0");
    const minute       = date.getMinutes().toString().padStart(2, "0");
    const second       = date.getSeconds().toString().padStart(2, "0");
    const dayOfTheWeek = date.getDay();
    const dayListJa    = ['日', '月', '火', '水', '木', '金', '土'];
  
    timer.innerHTML = `${month}/${day}(${dayListJa[dayOfTheWeek]}) ${hour}:${minute}:${second}`;

    const dateList = { year, month, day, hour, minute, second };
    return dateList;
  }
  setInterval(timeData, 1000);


  //three.js初期化
  const width  = window.innerWidth;
  const heihgt = window.innerHeight;

  let scene:    THREE.Scene;
  let camera:   THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;

  scene    = new THREE.Scene();
  camera   = new THREE.PerspectiveCamera(75, width / heihgt, 0.1, 2000);
  renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
  renderer.setClearColor(new THREE.Color(0x000000));
  renderer.setSize(width, heihgt);
  renderer.setPixelRatio(window.devicePixelRatio);

  const orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.02;


  //ambiLight
  const ambiLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambiLight);

  //SpotLight(色, 光の強さ, 距離, 角度, ボケ具合, 減衰率)
  const spotLight = new THREE.SpotLight(0xFFFFFF, 5, 100, Math.PI / 8, 10, 0.5);
  spotLight.position.y = 10;
  scene.add(spotLight);

  //helper
  const cameraHelper = new THREE.CameraHelper(camera);
  scene.add(cameraHelper);


  //torusTexture未決定
  // const texture = new THREE.TextureLoader().load(a);
  const texture = new THREE.TextureLoader().load(b);
  // const texture = new THREE.TextureLoader().load(c);
  // const texture = new THREE.TextureLoader().load(d);
  // const texture = new THREE.TextureLoader().load(e);
  // const texture = new THREE.TextureLoader().load(f);

  //-----------------------------------------------------------------------------
  
  let shufflePosition: Ring[];
  let num = 0;


  //配列の中身をシャッフルする
  function shuffleArray(sourceArray: Ring[]) {
    const array = sourceArray.concat();
    const arrayLength = array.length;

    for (let i = arrayLength - 1; i >= 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
    }
    return array;
  }
  shufflePosition = shuffleArray(positionArray);


  //add TorusGeometry
  function createTorus(): void {
    const randColor     = new THREE.Color(`hsl(${Math.floor(Math.random() * 361)}, 100%, 50%)`);
    const torusGeometry = new THREE.TorusGeometry(5.5, 1.5, 8, 50);
    const torusMaterial = new THREE.MeshBasicMaterial({
      color: randColor,
      map: texture,
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.scale.set(0.08, 0.08, 0.08);
    scene.add(torus);

    const pos = shufflePosition.pop();
    if (!pos) { return }
    torus.position.set(pos.positionX, pos.positionY, 0);
    torus.rotation.set(pos.rotateX,   pos.rotateY, 0);

    /*reduxを使わないでリングをすべて表示させた次のアクション時
      ・配列に新しくシャッフルしたtorus情報を格納し、一つだけは取り出し表示しておく
    */
    lastUpdate.innerHTML = `最終更新日時: ${timeData().year}.${timeData().month}.${timeData().day}.${timeData().hour}.${timeData().minute}.${timeData().second}`;

    createMessage(num);
    num++;
  };


  //カメラのアップデート
  const clock = new THREE.Clock();
  function cameraUpdate() {
    const elapsedTime = clock.getElapsedTime(); //ブラウザを表示してからの経過時間
    camera.position.x = Math.cos(elapsedTime * 0.1) * 10;
    camera.position.y = 0;
    camera.position.z = Math.sin(elapsedTime * 0.1) * 10;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
  }


  //照明のアップデート
  function lightPositionUpdate() {
    const t = Date.now() / 1000;
    const r = 20.0;
    const lx = r * Math.cos(t);
    const lz = r * Math.sin(t);
    // const ly = 6.0 + 5.0 * Math.sin(t / 10.0);
    spotLight.position.set(lx, 0, lz);
  }


  //いろいろ更新
  function loop(): void {
    cameraUpdate();
    lightPositionUpdate();

    requestAnimationFrame(loop);
    renderer.render(scene, camera);
  }
  loop();


  //画面のサイズが切り替わったら
  function onResize(): void {
    camera.aspect = width / heihgt;
    camera.updateProjectionMatrix();
    renderer.setSize(width, heihgt);
    renderer.setPixelRatio(window.devicePixelRatio);
  }


  //コメントを飛ばす
  const getComment: CommentArr = commentArray;
  function createMessage(messageNum: number) {
    const comment = document.createElement('span');
    comment.innerHTML = getComment[messageNum];
    
    comment.style.left = 0 + "%";
    comment.style.top  = (Math.random() * 85 + 5) + "%";
    commentBox.appendChild(comment);
  }

  bt.addEventListener('click', createTorus);
  window.addEventListener('resize', onResize);
}
window.addEventListener('load', init);