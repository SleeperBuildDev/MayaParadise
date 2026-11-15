// Single import point for three.js r186.1 (vendored, minified; see vendor/three/).
// Every game module imports THREE from here so the whole game shares one module instance.
import { BufferGeometry, IntType } from '../../vendor/three/three.min.js';

export * from '../../vendor/three/three.min.js';
export { mergeGeometries, mergeVertices } from '../../vendor/three/BufferGeometryUtils.js';

// Every vertex attribute goes to the GPU as 32-bit floats (or as a normalised or true-integer one). A whole-number
// array (Uint8 / Uint16 / Int32 ...) read as a float attribute, like the ground's paint kind (gKind, Uint8) and the
// skinned people's bone indices (skinIndex, Uint16), is a "scaled" vertex format phone GPUs do not have: Chrome
// converts those buffers for them, and on the owner's phone that conversion came out wrong now and then for one
// frame: a patch of ground lost its paint (flat pink paper with straight diagonal edges, where the paint's kind went
// over 1.5 inside a triangle) and every townsperson far off vanished in that same frame. Floats need no conversion.
const WHOLE = [Uint8Array, Uint8ClampedArray, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array];
const setAttribute0 = BufferGeometry.prototype.setAttribute;
BufferGeometry.prototype.setAttribute = function (name, attribute) {
  const a = attribute?.array;
  // (never one the GPU may already hold: version 0 = never updated; normalised and true-integer ones are native)
  if (a && !attribute.isInterleavedBufferAttribute && !attribute.normalized && attribute.gpuType !== IntType
    && attribute.version === 0 && WHOLE.some((T) => a instanceof T)) attribute.array = new Float32Array(a);
  return setAttribute0.call(this, name, attribute);
};
