declare module 'versor' {
  type Vec3 = [number, number, number];
  type Quat = [number, number, number, number];

  interface Versor {
    (angles: Vec3): Quat;
    cartesian(spherical: [number, number]): Vec3;
    rotation(q: Quat): Vec3;
    delta(v0: Vec3, v1: Vec3, alpha?: number): Quat;
    multiply(q0: Quat, q1: Quat): Quat;
  }

  const versor: Versor;
  export default versor;
}
