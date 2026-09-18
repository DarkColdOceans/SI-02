import { runBottleneckVerification } from './bottleneckEngine'
import { runSimulationVerification } from './simulationEngine'

const simulation = runSimulationVerification()
for (const line of simulation.messages) {
  console.log(line)
}

const bottleneck = runBottleneckVerification()
for (const line of bottleneck.messages) {
  console.log(line)
}

if (!simulation.passed || !bottleneck.passed) {
  throw new Error('Simulation verification failed')
}
