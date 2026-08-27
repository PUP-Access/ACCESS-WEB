"use client"

import { useEffect, useRef } from "react"

export interface CrystalConfig {
  x: number
  y: number
  z: number
  size: number
  hue: number
  sx: number
  sy: number
  sz: number
  fa: number
  fs: number
  phase: number
}

export const DEFAULT_CRYSTALS: CrystalConfig[] = [
  // Left wing crystals
  { x: -9.5, y: 4.5, z: 0.5, size: 2.2, hue: 0.02, sx: 0.003, sy: 0.004, sz: 0.002, fa: 0.32, fs: 0.45, phase: 0.0 },
  { x: -8.8, y: 1.8, z: -0.5, size: 1.3, hue: 0.01, sx: 0.005, sy: 0.003, sz: 0.004, fa: 0.24, fs: 0.60, phase: 1.1 },
  { x: -9.2, y: -0.8, z: 0.8, size: 1.0, hue: 0.00, sx: 0.004, sy: 0.006, sz: 0.003, fa: 0.18, fs: 0.75, phase: 2.3 },
  { x: -8.4, y: -2.8, z: -0.8, size: 0.7, hue: 0.015, sx: 0.006, sy: 0.004, sz: 0.005, fa: 0.14, fs: 0.85, phase: 3.5 },
  { x: -9.6, y: -4.8, z: 0.3, size: 1.8, hue: 0.02, sx: 0.003, sy: 0.005, sz: 0.003, fa: 0.30, fs: 0.50, phase: 1.7 },

  // Right wing crystals
  { x: 9.5, y: 4.2, z: 0.5, size: 1.0, hue: 0.00, sx: 0.005, sy: 0.003, sz: 0.004, fa: 0.20, fs: 0.70, phase: 1.4 },
  { x: 9.8, y: -1.2, z: 0.8, size: 1.5, hue: 0.03, sx: 0.004, sy: 0.005, sz: 0.003, fa: 0.28, fs: 0.55, phase: 2.2 },
  { x: 8.8, y: -4.5, z: 0.5, size: 1.8, hue: 0.01, sx: 0.003, sy: 0.004, sz: 0.003, fa: 0.35, fs: 0.50, phase: 1.8 },
  { x: 8.5, y: 2.0, z: -1.2, size: 0.7, hue: 0.00, sx: 0.007, sy: 0.003, sz: 0.005, fa: 0.18, fs: 0.90, phase: 0.8 },
]

interface CrystalDice3DProps {
  crystals?: CrystalConfig[]
  cameraZ?: number
  className?: string
}

export default function CrystalDice3D({
  crystals = DEFAULT_CRYSTALS,
  cameraZ = 14,
  className,
}: CrystalDice3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const crystalsRef = useRef(crystals)
  const cameraZRef = useRef(cameraZ)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
    script.onload = () => initScene(mount, crystalsRef.current, cameraZRef.current)
    document.head.appendChild(script)

    return () => {
      if ((mount as any)._cleanup) (mount as any)._cleanup()
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: "100%",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  )
}

function initScene(mount: HTMLDivElement, configs: CrystalConfig[], cameraZ: number) {
  const THREE = (window as any).THREE

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(mount.clientWidth, mount.clientHeight)
  renderer.setClearColor(0x000000, 0)
  mount.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const initialAspect = mount.clientWidth / Math.max(mount.clientHeight, 1)
  const camera = new THREE.PerspectiveCamera(50, initialAspect, 0.1, 100)
  camera.position.set(0, 0, cameraZ)

  const ambient = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambient)

  const lights = [
    { color: 0xffffff, intensity: 2.5, pos: [5, 8, 6] },
    { color: 0x8866ff, intensity: 1.5, pos: [-6, -4, 4] },
    { color: 0xff6644, intensity: 1.0, pos: [4, -6, -3] },
    { color: 0x44aaff, intensity: 1.2, pos: [-5, 6, -4] },
  ]
  lights.forEach(({ color, intensity, pos }) => {
    const light = new THREE.PointLight(color, intensity, 30)
    light.position.set(...(pos as [number, number, number]))
    scene.add(light)
  })

  function makeMaterial(hue: number) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setHSL(hue, 0.3, 0.55),
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.88,
      thickness: 1.2,
      ior: 2.1,
      reflectivity: 1.0,
      transparent: true,
      opacity: 0.88,
      envMapIntensity: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 1.0,
      iridescenceIOR: 1.8,
      iridescenceThicknessRange: [100, 800],
      side: THREE.DoubleSide,
    })
  }

  function makeOctahedron(size: number, hue: number) {
    const geo = new THREE.OctahedronGeometry(size, 0)
    geo.scale(1, 0.75, 1)
    const mat = makeMaterial(hue)
    const mesh = new THREE.Mesh(geo, mat)

    const edgeGeo = new THREE.EdgesGeometry(geo)
    const edgeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color().setHSL(hue, 0.6, 0.85),
      transparent: true,
      opacity: 0.35,
    })
    const edges = new THREE.LineSegments(edgeGeo, edgeMat)
    mesh.add(edges)

    return mesh
  }

  // Calculate position multiplier to keep crystals in the outer wings regardless of screen aspect ratio
  function getXMultiplier(aspect: number) {
    const refAspect = 16 / 9
    if (aspect >= refAspect) return 1.0
    // As aspect ratio narrows, push the coordinates outward so they never encroach on the center content
    return Math.max(1.0, (refAspect / Math.max(aspect, 0.6)) * 0.85)
  }

  let currentAspect = initialAspect
  let xMultiplier = getXMultiplier(currentAspect)

  const meshes = configs.map((c) => {
    const mesh = makeOctahedron(c.size, c.hue)
    mesh.position.set(c.x * xMultiplier, c.y, c.z)
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    )
    scene.add(mesh)
    return { mesh, config: c, baseY: c.y }
  })

  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  const envScene = new THREE.Scene()
  envScene.background = new THREE.Color(0x111122)
  const envTexture = pmremGenerator.fromScene(envScene).texture
  scene.environment = envTexture

  let frameId: number
  let t = 0

  function animate() {
    frameId = requestAnimationFrame(animate)
    t += 0.01

    meshes.forEach(({ mesh, config, baseY }) => {
      mesh.rotation.x += config.sx
      mesh.rotation.y += config.sy
      mesh.rotation.z += config.sz
      mesh.position.y = baseY + Math.sin(t * config.fs + config.phase) * config.fa
      mesh.position.x = config.x * xMultiplier + Math.cos(t * config.fs * 0.5 + config.phase) * 0.12
    })

    renderer.render(scene, camera)
  }

  animate()

  function onResize() {
    const w = mount.clientWidth
    const h = Math.max(mount.clientHeight, 1)
    currentAspect = w / h
    xMultiplier = getXMultiplier(currentAspect)
    camera.aspect = currentAspect
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)

    // Adjust mesh scale on narrow viewports
    const scaleFactor = w < 640 ? 0.65 : w < 1024 ? 0.85 : 1.0
    meshes.forEach(({ mesh, config }) => {
      mesh.scale.setScalar(scaleFactor)
    })
  }
  window.addEventListener("resize", onResize)
  onResize()

  ;(mount as any)._cleanup = () => {
    cancelAnimationFrame(frameId)
    window.removeEventListener("resize", onResize)
    renderer.dispose()
    if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
  }
}
