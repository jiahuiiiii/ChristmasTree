import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

// === SHADERS - Warm, realistic Christmas tree with varied decorations ===
// Types: 0=needle, 1=sphere ornament, 2=star, 3=fairy light, 4=garland bead, 5=heart, 6=ribbon bow
const vertexShader = `
  uniform float uTime;
  uniform float uHideFoliage;
  attribute float aSize;
  attribute float aPhase;
  attribute float aType;
  attribute float aColorVariant;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vType;
  varying float vColorVariant;

  void main() {
    vec3 pos = position;

    // Gentle sway for needles only
    if (aType < 0.5) {
      float sway = sin(uTime * 0.5 + aPhase) * 0.02;
      pos.x += sway;
      pos.z += sway * 0.5;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Hide foliage (type 0) when uHideFoliage is 1
    float hideMultiplier = (aType < 0.5 && uHideFoliage > 0.5) ? 0.0 : 1.0;
    gl_PointSize = aSize * (60.0 / -mvPosition.z) * hideMultiplier;

    vType = aType;
    vColorVariant = aColorVariant;

    // Realistic Christmas tree color palette - darker blue-green forest tones
    vec3 deepPine = vec3(0.02, 0.08, 0.04);      // Very dark forest green
    vec3 forestGreen = vec3(0.05, 0.15, 0.08);   // Dark forest green  
    vec3 pineGreen = vec3(0.08, 0.20, 0.10);     // Classic pine color
    vec3 blueGreen = vec3(0.06, 0.18, 0.14);     // Blue-green tint (spruce)
    vec3 warmGold = vec3(1.0, 0.82, 0.3);
    vec3 richRed = vec3(0.85, 0.08, 0.08);
    vec3 pureWhite = vec3(1.0, 1.0, 1.0);
    vec3 cream = vec3(1.0, 0.95, 0.85);
    vec3 warmLight = vec3(1.0, 0.9, 0.6);
    vec3 champagne = vec3(0.95, 0.85, 0.65);
    vec3 pinkRed = vec3(0.95, 0.3, 0.4);
    vec3 burgundy = vec3(0.6, 0.1, 0.15);

    if (aType > 5.5) {
      // Ribbon bow - golden or red
      if (aColorVariant < 0.5) {
        vColor = warmGold * 1.1;
      } else {
        vColor = richRed * 1.1;
      }
      vAlpha = 1.0;
    } else if (aType > 4.5) {
      // Heart ornament - red/pink shades
      if (aColorVariant < 0.4) {
        vColor = richRed;
      } else if (aColorVariant < 0.7) {
        vColor = pinkRed;
      } else {
        vColor = warmGold; // Golden hearts
      }
      vColor *= 0.9 + sin(uTime * 1.5 + aPhase * 3.0) * 0.1;
      vAlpha = 1.0;
    } else if (aType > 3.5) {
      // Garland beads - golden string
      vColor = warmGold * 0.9;
      vAlpha = 1.0;
    } else if (aType > 2.5) {
      // Fairy lights - warm golden twinkling
      float twinkle = sin(uTime * 4.0 + aPhase * 15.0) * 0.3 + 0.7;
      vColor = warmLight * (1.2 + twinkle * 0.5);
      vAlpha = 1.0;
    } else if (aType > 1.5) {
      // Star - golden wireframe
      float pulse = sin(uTime * 1.5) * 0.15 + 0.85;
      vColor = warmGold * pulse * 1.3;
      vAlpha = 1.0;
    } else if (aType > 0.5) {
      // Sphere ornaments - colorful baubles
      float variant = aColorVariant;
      if (variant < 0.3) {
        vColor = richRed;
      } else if (variant < 0.5) {
        vColor = warmGold;
      } else if (variant < 0.7) {
        vColor = pureWhite * 0.95;
      } else if (variant < 0.85) {
        vColor = champagne;
      } else {
        vColor = mix(warmGold, cream, 0.3);
      }
      vColor *= 0.9 + sin(uTime * 2.0 + aPhase * 5.0) * 0.1;
      vAlpha = 1.0;
    } else {
      // Pine needles - realistic dark forest green with blue undertones
      float layer = sin(aPhase * 8.0) * 0.5 + 0.5;
      float depth = sin(aPhase * 3.0) * 0.5 + 0.5;
      float blueHint = sin(aPhase * 5.0) * 0.5 + 0.5;
      
      // Mix between dark forest greens with subtle blue variation
      vec3 baseGreen = mix(deepPine, forestGreen, layer);
      baseGreen = mix(baseGreen, pineGreen, depth * 0.3);
      baseGreen = mix(baseGreen, blueGreen, blueHint * 0.2); // Subtle blue-green
      
      // Subtle warm light influence from fairy lights
      baseGreen += warmLight * 0.03;
      
      // Natural brightness variation
      float brightness = 0.85 + layer * 0.15;
      vColor = baseGreen * brightness;
      vAlpha = 1.0;
    }
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vType;
  varying float vColorVariant;

  // Wireframe star SDF
  float sdStar5(in vec2 p, in float r, in float rf) {
    const vec2 k1 = vec2(0.809016994375, -0.587785252292);
    const vec2 k2 = vec2(-k1.x, k1.y);
    p.x = abs(p.x);
    p -= 2.0 * max(dot(k1, p), 0.0) * k1;
    p -= 2.0 * max(dot(k2, p), 0.0) * k2;
    p.x = abs(p.x);
    p.y -= r;
    vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0, 1);
    float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
    return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
  }

  // Heart SDF
  float sdHeart(vec2 p) {
    p.x = abs(p.x);
    if (p.y + p.x > 1.0) {
      return sqrt(dot(p - vec2(0.25, 0.75), p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
    }
    return sqrt(min(dot(p - vec2(0.0, 1.0), p - vec2(0.0, 1.0)),
                    dot(p - 0.5 * max(p.x + p.y, 0.0), p - 0.5 * max(p.x + p.y, 0.0)))) 
           * sign(p.x - p.y);
  }

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    
    // Light direction (upper-left)
    vec3 lightDir = normalize(vec3(-0.5, 0.7, 1.0));
    
    if (vType > 5.5) {
      // Candy cane - curved hook with red and white stripes
      vec2 p = uv * 2.4;
      
      // Create candy cane shape: vertical stick + curved hook at top
      float caneWidth = 0.12;
      
      // Straight part (bottom portion)
      float stick = abs(p.x) - caneWidth;
      stick = max(stick, p.y - 0.1);  // Top of straight part
      stick = max(stick, -p.y - 0.55); // Bottom
      
      // Curved hook at top
      vec2 hookCenter = vec2(0.2, 0.1);
      float hookRadius = 0.2;
      float hookDist = abs(length(p - hookCenter) - hookRadius) - caneWidth;
      // Only keep the top-right curve
      hookDist = max(hookDist, -p.y + 0.1); // Below the curve start
      hookDist = max(hookDist, -p.x);       // Left side cut
      
      // Combine stick and hook
      float cane = min(stick, hookDist);
      
      if (cane > 0.03) discard;
      
      // Calculate position along the cane for stripe pattern
      float stripeCoord;
      if (stick < hookDist) {
        // On the stick - use y position
        stripeCoord = p.y * 5.0;
      } else {
        // On the hook - use angle around curve
        float angle = atan(p.y - hookCenter.y, p.x - hookCenter.x);
        stripeCoord = angle * 2.5;
      }
      
      // Red and white stripes
      float stripe = sin(stripeCoord * 8.0);
      vec3 red = vec3(0.9, 0.1, 0.1);
      vec3 white = vec3(1.0, 0.98, 0.95);
      vec3 caneColor = mix(red, white, smoothstep(-0.2, 0.2, stripe));
      
      // 3D cylindrical shading
      float cylX = abs(p.x);
      if (hookDist < stick) {
        // On hook - calculate distance from hook center line
        vec2 toCenter = normalize(p - hookCenter);
        cylX = abs(length(p - hookCenter) - hookRadius);
      }
      float cylShade = sqrt(max(0.0, 1.0 - pow(cylX / caneWidth, 2.0)));
      vec3 normal = normalize(vec3(p.x * 2.0, 0.0, cylShade));
      
      float diffuse = max(0.4, dot(normal, lightDir));
      
      // Glossy candy shine
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      vec3 halfVec = normalize(lightDir + viewDir);
      float specular = pow(max(0.0, dot(normal, halfVec)), 50.0) * 0.9;
      
      vec3 finalColor = caneColor * diffuse;
      finalColor += vec3(1.0) * specular;
      
      float edge = 1.0 - smoothstep(0.0, 0.03, cane);
      gl_FragColor = vec4(finalColor, vAlpha * edge);
      
    } else if (vType > 4.5) {
      // Heart ornament - glossy 3D glass/ceramic
      vec2 p = uv * 2.8;
      p.y = -p.y + 0.3;
      
      float d = sdHeart(p);
      
      if (d > 0.08) discard;
      
      // Calculate 3D normal for heart shape
      float heartRadius = 0.35;
      float distFromCenter = length(p - vec2(0.0, 0.5));
      float z = sqrt(max(0.0, heartRadius * heartRadius - d * d * 0.5));
      vec3 normal = normalize(vec3(p.x * 0.3, (p.y - 0.5) * 0.3, z));
      
      // Diffuse lighting
      float diffuse = max(0.25, dot(normal, lightDir));
      
      // Glossy specular highlight
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      vec3 halfVec = normalize(lightDir + viewDir);
      float specular = pow(max(0.0, dot(normal, halfVec)), 40.0) * 1.2;
      float specular2 = pow(max(0.0, dot(normal, halfVec)), 80.0) * 0.8;
      
      // Fresnel rim lighting
      float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0) * 0.4;
      
      // Ambient occlusion at edges
      float ao = smoothstep(0.08, -0.15, d);
      
      vec3 heartColor = vColor * diffuse * ao;
      heartColor += vec3(1.0, 0.98, 0.95) * specular;
      heartColor += vec3(1.0) * specular2;
      heartColor += vColor * fresnel;
      
      float edge = 1.0 - smoothstep(-0.1, 0.08, d);
      gl_FragColor = vec4(heartColor, vAlpha * edge);
      
    } else if (vType > 3.5) {
      // Garland bead - small metallic sphere
      float r = length(uv);
      if (r > 0.4) discard;
      
      // 3D sphere normal
      float z = sqrt(max(0.0, 0.16 - r * r));
      vec3 normal = normalize(vec3(uv, z));
      
      float diffuse = max(0.3, dot(normal, lightDir));
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      vec3 halfVec = normalize(lightDir + viewDir);
      float specular = pow(max(0.0, dot(normal, halfVec)), 60.0);
      
      vec3 beadColor = vColor * diffuse + vec3(1.0) * specular * 0.8;
      gl_FragColor = vec4(beadColor, vAlpha);
      
    } else if (vType > 2.5) {
      // Fairy light - bright glowing dot with halo
      float r = length(uv);
      if (r > 0.5) discard;
      
      float core = 1.0 - smoothstep(0.0, 0.15, r);
      float glow = 1.0 - smoothstep(0.0, 0.5, r);
      glow = pow(glow, 2.0);
      
      vec3 finalColor = vColor * (core * 1.5 + glow * 0.8);
      gl_FragColor = vec4(finalColor, vAlpha * max(core, glow));
      
    } else if (vType > 1.5) {
      // Star - 3D golden star with metallic sheen
      float d = sdStar5(uv * 2.0, 0.4, 0.45);
      float outline = abs(d);
      
      if (outline > 0.15) discard;
      
      // Add 3D depth to star
      float starZ = smoothstep(0.15, 0.0, outline);
      vec3 normal = normalize(vec3(uv * 2.0, starZ + 0.5));
      
      float diffuse = max(0.4, dot(normal, lightDir));
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      vec3 halfVec = normalize(lightDir + viewDir);
      float specular = pow(max(0.0, dot(normal, halfVec)), 30.0) * 0.9;
      
      float wire = 1.0 - smoothstep(0.0, 0.08, outline);
      float glow = 1.0 - smoothstep(0.0, 0.15, outline);
      
      vec3 finalColor = vColor * diffuse * (wire * 1.2 + glow * 0.5);
      finalColor += vec3(1.0, 0.95, 0.8) * specular;
      
      gl_FragColor = vec4(finalColor, vAlpha * max(wire, glow * 0.6));
      
    } else if (vType > 0.5) {
      // Sphere ornament - realistic glass bauble with reflections
      float r = length(uv);
      if (r > 0.48) discard;
      
      // Calculate 3D sphere normal
      float sphereRadius = 0.48;
      float z = sqrt(max(0.0, sphereRadius * sphereRadius - r * r));
      vec3 normal = normalize(vec3(uv, z));
      
      // Diffuse lighting with wrapped lighting for softer look
      float diffuse = dot(normal, lightDir) * 0.5 + 0.5;
      diffuse = diffuse * 0.6 + 0.4; // Ambient boost
      
      // Primary specular highlight (sharp)
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      vec3 halfVec = normalize(lightDir + viewDir);
      float specular1 = pow(max(0.0, dot(normal, halfVec)), 80.0) * 1.5;
      
      // Secondary specular (broader)
      float specular2 = pow(max(0.0, dot(normal, halfVec)), 20.0) * 0.4;
      
      // Small bright reflection spot
      float spotLight = 1.0 - smoothstep(0.0, 0.06, length(uv - vec2(-0.12, 0.20)));
      
      // Fresnel rim lighting (glass edge glow)
      float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 4.0) * 0.5;
      
      // Subtle environment reflection
      float envReflect = pow(1.0 - max(0.0, dot(normal, viewDir)), 2.0) * 0.15;
      
      // Combine all lighting
      vec3 ornamentColor = vColor * diffuse;
      ornamentColor += vec3(1.0, 0.98, 0.95) * specular1; // Sharp white highlight
      ornamentColor += vColor * 0.3 * specular2; // Colored broad highlight
      ornamentColor += vec3(1.0) * spotLight * 0.9; // Bright spot
      ornamentColor += vColor * fresnel; // Rim glow
      ornamentColor += vec3(0.9, 0.95, 1.0) * envReflect; // Sky reflection
      
      // Soft edge antialiasing
      float alpha = 1.0 - smoothstep(0.45, 0.48, r);
      gl_FragColor = vec4(ornamentColor, vAlpha * alpha);
      
    } else {
      // Pine needle - elongated needle shape for realistic texture
      vec2 p = uv;
      // Rotate slightly based on color variant for variety
      float angle = vColorVariant * 3.14159 * 0.5;
      float c = cos(angle);
      float s = sin(angle);
      p = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
      
      // Elongated ellipse for needle shape
      float rx = length(vec2(p.x * 2.5, p.y));
      if (rx > 0.45) discard;
      
      // Add slight texture variation
      float tex = 0.9 + sin(p.x * 30.0) * 0.1;
      gl_FragColor = vec4(vColor * tex, vAlpha);
    }
  }
`;

// === COMPONENT ===
export const ChristmasTree: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  // Cache the target mode to prevent mid-animation direction changes
  const targetModeRef = useRef<'TREE' | 'SCATTER' | 'FOCUS'>('TREE');
  const animatingRef = useRef(false);

  // Reduced count - decorations only (no foliage)
  const count = 3000;

  const { treePositions, scatterPositions, sizes, phases, types, colorVariants } = useMemo(() => {
    const tPos = new Float32Array(count * 3);
    const sPos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);
    const tp = new Float32Array(count);
    const cv = new Float32Array(count);

    const treeHeight = 14;
    const baseRadius = 5.0;
    
    const scatterRadius = 18;
    
    const getScatterPosition = () => {
      // 3D spherical distribution for rotation from any angle
      const theta = Math.random() * Math.PI * 2; // horizontal angle
      const phi = Math.acos(2 * Math.random() - 1); // vertical angle (uniform on sphere)
      const r = Math.cbrt(Math.random()) * scatterRadius; // cube root for uniform volume
      
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi)
      };
    };
    
    let idx = 0;

    // === 1. GOLDEN WIREFRAME STAR ===
    tPos[idx * 3] = 0;
    tPos[idx * 3 + 1] = treeHeight / 2 + 0.3;
    tPos[idx * 3 + 2] = 0;
    sPos[idx * 3] = 0;
    sPos[idx * 3 + 1] = scatterRadius * 0.8;
    sPos[idx * 3 + 2] = 0;
    sz[idx] = 30;
    ph[idx] = 0;
    tp[idx] = 2;
    cv[idx] = 0;
    idx++;

    // === 2. WARM FAIRY LIGHTS ===
    const lightCount = 1200;
    for (let i = 0; i < lightCount && idx < count; i++) {
      const h = Math.pow(Math.random(), 0.6);
      const y = -treeHeight / 2 + h * treeHeight;
      const coneRadius = baseRadius * (1.0 - h * 0.98);
      const angle = Math.random() * Math.PI * 2;
      const r = coneRadius * (0.7 + Math.random() * 0.35);
      
      tPos[idx * 3] = r * Math.cos(angle);
      tPos[idx * 3 + 1] = y;
      tPos[idx * 3 + 2] = r * Math.sin(angle);

      const scatter = getScatterPosition();
      sPos[idx * 3] = scatter.x;
      sPos[idx * 3 + 1] = scatter.y;
      sPos[idx * 3 + 2] = scatter.z;

      sz[idx] = 3.0 + Math.random() * 2.0;
      ph[idx] = Math.random() * 100;
      tp[idx] = 3;
      cv[idx] = 0;
      idx++;
    }

    // === 3. SPHERE ORNAMENTS ===
    const ornamentCount = 280;
    for (let i = 0; i < ornamentCount && idx < count; i++) {
      const h = 0.1 + Math.random() * 0.8;
      const y = -treeHeight / 2 + h * treeHeight;
      const coneRadius = baseRadius * (1.0 - h * 0.98);
      const angle = Math.random() * Math.PI * 2;
      const r = coneRadius * (1.0 + Math.random() * 0.1);
      const droop = 0.1 + Math.random() * 0.25;
      
      tPos[idx * 3] = r * Math.cos(angle);
      tPos[idx * 3 + 1] = y - droop;
      tPos[idx * 3 + 2] = r * Math.sin(angle);

      const scatter = getScatterPosition();
      sPos[idx * 3] = scatter.x;
      sPos[idx * 3 + 1] = scatter.y;
      sPos[idx * 3 + 2] = scatter.z;

      sz[idx] = 6 + Math.random() * 5;
      ph[idx] = Math.random() * 100;
      tp[idx] = 1;
      cv[idx] = Math.random();
      idx++;
    }

    // === 4. HEART ORNAMENTS ===
    const heartCount = 100;
    for (let i = 0; i < heartCount && idx < count; i++) {
      const h = 0.15 + Math.random() * 0.7;
      const y = -treeHeight / 2 + h * treeHeight;
      const coneRadius = baseRadius * (1.0 - h * 0.98);
      const angle = Math.random() * Math.PI * 2;
      const r = coneRadius * (1.0 + Math.random() * 0.08);
      const droop = 0.15 + Math.random() * 0.3;
      
      tPos[idx * 3] = r * Math.cos(angle);
      tPos[idx * 3 + 1] = y - droop;
      tPos[idx * 3 + 2] = r * Math.sin(angle);

      const scatter = getScatterPosition();
      sPos[idx * 3] = scatter.x;
      sPos[idx * 3 + 1] = scatter.y;
      sPos[idx * 3 + 2] = scatter.z;

      sz[idx] = 7 + Math.random() * 4;
      ph[idx] = Math.random() * 100;
      tp[idx] = 5; // Heart type
      cv[idx] = Math.random();
      idx++;
    }

    // === 5. RIBBON BOWS ===
    const ribbonCount = 25;
    for (let i = 0; i < ribbonCount && idx < count; i++) {
      const h = 0.2 + Math.random() * 0.65;
      const y = -treeHeight / 2 + h * treeHeight;
      const coneRadius = baseRadius * (1.0 - h * 0.98);
      const angle = Math.random() * Math.PI * 2;
      const r = coneRadius * (1.02 + Math.random() * 0.05);
      
      tPos[idx * 3] = r * Math.cos(angle);
      tPos[idx * 3 + 1] = y;
      tPos[idx * 3 + 2] = r * Math.sin(angle);

      const scatter = getScatterPosition();
      sPos[idx * 3] = scatter.x;
      sPos[idx * 3 + 1] = scatter.y;
      sPos[idx * 3 + 2] = scatter.z;

      sz[idx] = 22 + Math.random() * 6;
      ph[idx] = Math.random() * 100;
      tp[idx] = 6; // Ribbon type
      cv[idx] = Math.random();
      idx++;
    }

    // === 6. GOLDEN GARLAND BEADS ===
    const garlandCount = 900;
    for (let i = 0; i < garlandCount && idx < count; i++) {
      const loops = 8;
      const t = i / garlandCount;
      const spiralAngle = t * Math.PI * 2 * loops;
      const h = t;
      const y = -treeHeight / 2 + h * treeHeight * 0.9;
      const coneRadius = baseRadius * (1.0 - h * 0.98);
      const r = coneRadius * (1.02 + Math.sin(spiralAngle * 3) * 0.05);
      
      tPos[idx * 3] = r * Math.cos(spiralAngle);
      tPos[idx * 3 + 1] = y + Math.sin(spiralAngle * 2) * 0.15;
      tPos[idx * 3 + 2] = r * Math.sin(spiralAngle);

      const scatter = getScatterPosition();
      sPos[idx * 3] = scatter.x;
      sPos[idx * 3 + 1] = scatter.y;
      sPos[idx * 3 + 2] = scatter.z;

      sz[idx] = 1.5 + Math.random() * 0.5;
      ph[idx] = Math.random() * 100;
      tp[idx] = 4;
      cv[idx] = 0;
      idx++;
    }

    // === 7. LUSH PINE FOLIAGE ===
    const foliageCount = count - idx;
    for (let i = 0; i < foliageCount && idx < count; i++) {
      const h = Math.pow(Math.random(), 0.5);
      const y = -treeHeight / 2 + h * treeHeight;
      const coneRadius = baseRadius * (1.0 - h * 0.98);
      const angle = Math.random() * Math.PI * 2;
      // Fill entire cone from center to edge - use sqrt for even distribution
      const radiusVariation = Math.sqrt(Math.random()) * 1.05; // 0 to 1.05, sqrt for even area fill
      const r = coneRadius * radiusVariation;
      const droop = (r / baseRadius) * 0.2;
      
      tPos[idx * 3] = r * Math.cos(angle);
      tPos[idx * 3 + 1] = y - droop;
      tPos[idx * 3 + 2] = r * Math.sin(angle);

      const scatter = getScatterPosition();
      sPos[idx * 3] = scatter.x;
      sPos[idx * 3 + 1] = scatter.y;
      sPos[idx * 3 + 2] = scatter.z;

      sz[idx] = 2.5 + Math.random() * 2.5; // Bigger needles for denser look
      ph[idx] = Math.random() * 100;
      tp[idx] = 0;
      cv[idx] = Math.random(); // Add random variant for needle rotation
      idx++;
    }

    return { 
      treePositions: tPos, 
      scatterPositions: sPos, 
      sizes: sz, 
      phases: ph, 
      types: tp,
      colorVariants: cv 
    };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current) return;

    // Read current viewMode directly from store (not React state)
    const currentViewMode = useAppStore.getState().viewMode;
    
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uHideFoliage.value = currentViewMode === 'FOCUS' ? 1.0 : 0.0;

    // Only change target mode when animation is complete
    if (!animatingRef.current && currentViewMode !== targetModeRef.current) {
      targetModeRef.current = currentViewMode;
      animatingRef.current = true;
    }

    const isScatter = targetModeRef.current === 'SCATTER' || targetModeRef.current === 'FOCUS';
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const speed = Math.min(1, 10.0 * delta);

    let maxDiff = 0;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const tx = isScatter ? scatterPositions[idx] : treePositions[idx];
      const ty = isScatter ? scatterPositions[idx + 1] : treePositions[idx + 1];
      const tz = isScatter ? scatterPositions[idx + 2] : treePositions[idx + 2];

      const dx = tx - positions[idx];
      const dy = ty - positions[idx + 1];
      const dz = tz - positions[idx + 2];
      maxDiff = Math.max(maxDiff, Math.abs(dx) + Math.abs(dy) + Math.abs(dz));

      positions[idx] += dx * speed;
      positions[idx + 1] += dy * speed;
      positions[idx + 2] += dz * speed;
    }
    
    // Mark animation as complete when particles are close to target
    if (maxDiff < 0.5) {
      animatingRef.current = false;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });



  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} args={[treePositions.slice(), 3]} />
        <bufferAttribute attach="attributes-aSize" count={count} args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" count={count} args={[phases, 1]} />
        <bufferAttribute attach="attributes-aType" count={count} args={[types, 1]} />
        <bufferAttribute attach="attributes-aColorVariant" count={count} args={[colorVariants, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={true}
        depthTest={true}
        alphaTest={0.01}
        uniforms={{
          uTime: { value: 0 },
          uHideFoliage: { value: 0 },
        }}
      />
    </points>
  );
};
