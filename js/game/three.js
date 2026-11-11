// Single import point for three.js r186.1 (vendored, minified; see vendor/three/).
// Every game module imports THREE from here so the whole game shares one module instance.
export * from '../../vendor/three/three.min.js';
export { mergeGeometries, mergeVertices } from '../../vendor/three/BufferGeometryUtils.js';
