import { SimulationCassette } from '../types';
import { cassetteGlobalTheater2035 } from './cassetteGlobalTheater2035';
import { cassetteTridentBallistic } from './cassetteTridentBallistic';

export const PRELOADED_CASSETTES: SimulationCassette[] = [
  cassetteGlobalTheater2035,
  cassetteTridentBallistic
];

export { cassetteGlobalTheater2035, cassetteTridentBallistic };
