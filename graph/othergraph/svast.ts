import * as T from './types'
import { comp, group, conn } from './util'

type GraphData = {
  elements: T.Elements
  connections: T.Connections
}

export const svast: GraphData = {
  elements: [
    group('ACS', [
      comp('Airspace_Manager'),
      comp('C2_Processor'),
      comp('Comms_Manager'),
      group('Contingency_Manager', [
        group('JOCA', [
          comp('Air_Collision_Avoidance'),
          comp('Ground_Collision_Avoidance')
        ]),
        comp('Sensor_Out'),
        comp('Terminal_Area')
      ]),
      comp('Executor'),
      comp('Fusion_Engine'),
      comp('L_16_Isolator'),
      comp('Logger'),
      comp('Mission_Engine'),
      comp('Neighbor_Estimator'),
      comp('Route_Planner'),
      comp('Run_Time_Assure'),
      comp('Task_Library'),
      comp('Task_Planner')
    ]),
    comp('HMI_1'),
    comp('HMI_2'),
    comp('Link16_Radio'),
    comp('Mission_Sensors'),
    comp('Post_Flight_Analysis_Tools'),
    comp('TNTT_Radio'),
    comp('VMS')
  ],
  connections: [
    // Top
    conn('Mission_Sensors', 'Fusion_Engine'),
    conn('Executor', 'VMS'),
    conn('HMI_2', 'Link16_Radio'),
    conn('HMI_1', 'TNTT_Radio'),
    conn('Link16_Radio', 'Terminal_Area'),
    // ACS
    conn('Logger', 'Post_Flight_Analysis_Tools'),
    conn('TNTT_Radio', 'Comms_Manager'),
    conn('C2_Processor', 'Mission_Engine'),
    conn('L_16_Isolator', 'C2_Processor'),
    conn('Run_Time_Assure', 'Executor'),
    conn('Fusion_Engine', 'Task_Library'),
    conn('Task_Library', 'Run_Time_Assure'),
    conn('Route_Planner', 'Task_Planner'),
    conn('Sensor_Out', 'Logger'),
    conn('Sensor_Out', 'Logger'),
    // Contingency_Manager
    conn('Route_Planner', 'Ground_Collision_Avoidance'),
    conn('Air_Collision_Avoidance', 'Run_Time_Assure')
  ]
}
