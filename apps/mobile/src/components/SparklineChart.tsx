import React from 'react';
import { View } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis } from 'victory-native';

interface DataPoint {
  x: number;
  y: number;
}

interface Props {
  data: DataPoint[];
  height?: number;
  width?: number;
}

export function SparklineChart({ data, height = 60, width = 120 }: Props) {
  if (!data || data.length === 0) return <View style={{ height, width }} />;

  return (
    <VictoryChart width={width} height={height} padding={{ top: 4, bottom: 4, left: 4, right: 4 }}>
      <VictoryAxis style={{ axis: { stroke: 'none' }, tickLabels: { fill: 'none' } }} />
      <VictoryLine
        data={data}
        style={{ data: { stroke: '#3b82f6', strokeWidth: 1.5 } }}
        interpolation="monotoneX"
      />
    </VictoryChart>
  );
}
