import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Ring, positionArray } from './torus_position';
import { CommentArr, commentArray } from './message';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import a from './assets/images/a.jpg';
import light from './assets/images/light.png';

const canvas: HTMLCanvasElement  = <HTMLCanvasElement>document.getElementById('canvas');
const bt    : HTMLButtonElement  = <HTMLButtonElement>document.getElementById('bt');
const latOut: HTMLSpanElement    = <HTMLSpanElement>document.getElementById('lat');
const lngOut: HTMLSpanElement    = <HTMLSpanElement>document.getElementById('lng');
const timer : HTMLDivElement     = <HTMLDivElement>document.getElementById('timer');
const commentBox: HTMLDivElement = <HTMLDivElement>document.getElementById('commentBox');

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
  function setTimer() {
    const date         = new Date();
    const month        = date.getMonth() + 1;
    const day          = date.getDate();
    const hour         = date.getHours().toString().padStart(2, "0");
    const minute       = date.getMinutes().toString().padStart(2, "0");
    const second       = date.getSeconds().toString().padStart(2, "0");
    const dayOfTheWeek = date.getDay();
    const dayListJa    = ['日', '月', '火', '水', '木', '金', '土'];
  
    timer.innerHTML = `${month}/${day}(${dayListJa[dayOfTheWeek]}) ${hour}:${minute}:${second}`;
  }
  setInterval(setTimer, 1000);


  //three.js初期化
  const width  = window.innerWidth;
  const heihgt = window.innerHeight;

  let scene:    THREE.Scene;
  let camera:   THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / heihgt, 0.1, 2000);
  renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
  renderer.setClearColor(new THREE.Color(0x000000));
  renderer.setSize(width, heihgt);
  renderer.setPixelRatio(window.devicePixelRatio);

  const orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.02;

  const texture = new THREE.TextureLoader().load(a);
  // const texture = new THREE.TextureLoader().load("./src/images/c.jpg")

  //Light
  const ambiLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambiLight);

  //SpotLight(色, 光の強さ, 距離, 角度, ボケ具合, 減衰率)
  const spotLight = new THREE.SpotLight(0xFFFFFF, 5, 100, Math.PI / 8, 10, 0.5);
  spotLight.position.y = 10;
  scene.add(spotLight);

  const lensFlare    = new Lensflare();
  const lensTexture = new THREE.TextureLoader().load(light);
  const lensColor   = new THREE.Color(0xffff00);
  lensFlare.addElement(new LensflareElement(lensTexture, 300, 0, lensColor));
  scene.add(lensFlare);
  lensFlare.position.copy(spotLight.position);
  lensFlare.position.y = 5;


  //helper
  const cameraHelper = new THREE.CameraHelper(camera);
  scene.add(cameraHelper);
  //-----------------------------------------------------------------------------
  
  let rX, rY: number;
  let shufflePosition: Ring[];
  let randomPosition: Ring;
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
    const randColor = new THREE.Color(`hsl(${Math.floor(Math.random() * 361)}, 100%, 50%)`);
    const torusGeometry = new THREE.TorusGeometry(5, 1.5, 8, 50);
    const torusMaterial = new THREE.MeshBasicMaterial({
      color: randColor,
      map: texture, 
    });
    const torus         = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.scale.set(0.08, 0.08, 0.08);

    const pos = shufflePosition.pop();
    console.log(pos);
    
    if (!pos) { return; }
    randomPosition = pos;
    torus.position.set(randomPosition.positionX, randomPosition.positionY, 0);
    
    
    if (num % 2 == 0) {                   //偶数
      rX = Math.floor(Math.random());
      rY = Math.floor(Math.random());
      torus.rotation.set(rX, rY, 0);
    } else {                              //奇数
      rX = Math.floor(Math.random() * 2); 
      rY = Math.floor(Math.random() * 5);
      torus.rotation.set(rX, rY, 0);
    }
    scene.add(torus);

    if (num == 71) {
      shufflePosition = shuffleArray(positionArray);
      randomPosition = pos;
      num = 0;
    }
    createMessage();
    num++;
  };


  //後ろのパーティクルたち
  function createParticle() {
    const count = 3000;
    const particleGeometry = new THREE.BufferGeometry();
    const particleArray    = new Float32Array(count * 3); //x, y, z必要
    const colorArray       = new Float32Array(count * 3);
  
    for (let i = 0; i < count * 3; i++ ) {
      particleArray[i] = (Math.random() - 0.5) * 20;
      colorArray[i]    = Math.random();
    }
  
    const position = new THREE.BufferAttribute(particleArray, 3); //x, y, zの3つあるから[3]にする
    particleGeometry.setAttribute('position', position);
  
    const color = new THREE.BufferAttribute(colorArray, 3);
    particleGeometry.setAttribute('color', color);
  
    const particleMaterial = new THREE.PointsMaterial({size: 0.025, vertexColors: true});
    const particle = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particle);
  }
  createParticle();


  //カメラのアップデート
  const clock = new THREE.Clock();
  function cameraUpdate() {
    const elapsedTime = clock.getElapsedTime(); //ブラウザを表示してからの経過時間
    camera.position.x = Math.cos(elapsedTime * 0.5) * 5;
    camera.position.y = -3.5;
    camera.position.z = Math.sin(elapsedTime * 0.5) * 10;
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


  //コメントを飛ばしていく
  const getComment: CommentArr = commentArray;
  function createMessage() {
    const comment = document.createElement('span');
    comment.innerHTML = getComment[num];
    
    comment.style.left = 0 + "%";
    comment.style.top  = (Math.random() * 85 + 5) + "%";
    commentBox.appendChild(comment);
  }

  bt.addEventListener('click', createTorus);
  window.addEventListener('resize', onResize);
}
window.addEventListener('load', init);