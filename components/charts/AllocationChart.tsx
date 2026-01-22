// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface AllocationChartProps {
  data: Array<{
    symbol: string;
    value: number;
    percentage: number;
    color: string;
  }>;
}

const CHART_SIZE = Dimensions.get('window').width - 64;
const CENTER = CHART_SIZE / 2;
const RADIUS = CHART_SIZE / 2 - 20;

export const AllocationChart: React.FC<AllocationChartProps> = ({ data }) => {
  /**
   * Render simple pie chart using View components
   */
  const renderPieChart = () => {
    let currentAngle = 0;

    return data.map((item, index) => {
      const angle = (item.percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      // For simplicity, show as stacked bars instead of pie
      // (True pie chart would require SVG or Canvas)
      return null;
    });
  };

  /**
   * Render as horizontal bars for simplicity
   */
  const renderBars = () => {
    return data.map((item, index) => (
      <View key={index} style={styles.barContainer}>
        <View style={styles.barLabelContainer}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <Text style={styles.barLabel}>{item.symbol}</Text>
        </View>
        
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${item.percentage}%`,
                backgroundColor: item.color,
              },
            ]}
          />
        </View>
        
        <Text style={styles.barPercentage}>{item.percentage.toFixed(1)}%</Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Simple donut visualization */}
      <View style={styles.donutContainer}>
        {data.map((item, index) => {
          const previousPercentages = data.slice(0, index).reduce((sum, d) => sum + d.percentage, 0);
          const startAngle = (previousPercentages / 100) * 360;
          const sweepAngle = (item.percentage / 100) * 360;

          return (
            <View
              key={index}
              style={[
                styles.donutSegment,
                {
                  backgroundColor: item.color,
                  transform: [
                    { rotate: `${startAngle}deg` },
                  ],
                  zIndex: data.length - index,
                },
              ]}
            >
              <View
                style={[
                  styles.donutSegmentInner,
                  {
                    transform: [{ rotate: `${sweepAngle}deg` }],
                  },
                ]}
              />
            </View>
          );
        })}
        
        {/* Center hole */}
        <View style={styles.donutHole}>
          <Text style={styles.donutHoleText}>
            {data.length}
          </Text>
          <Text style={styles.donutHoleLabel}>Assets</Text>
        </View>
      </View>

      {/* Legend / Bars */}
      <View style={styles.barsContainer}>
        {renderBars()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  donutContainer: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  donutSegment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  donutSegmentInner: {
    width: '100%',
    height: '100%',
  },
  donutHole: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1A1A',
    top: 30,
    left: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutHoleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FCD600',
  },
  donutHoleLabel: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 4,
  },
  barsContainer: {
    gap: 12,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#AAA',
    width: 50,
    textAlign: 'right',
  },
});
