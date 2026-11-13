// Resting values for the particle core and the backdrop waves. (In the full app a startup
// animation drives these; here they stay at rest.)
const particle = { live: false, rt: 0.58, boil: 0.17, freeze: false, birth: 1 };
const wave = { live: false, level: 0, burst: 0, ring: 0, open: 0 };
export const getParticleStage = () => particle;
export const getWaveStage = () => wave;
