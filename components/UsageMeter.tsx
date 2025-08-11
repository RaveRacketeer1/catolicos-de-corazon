import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface UsageMeterProps {
  title: string;
  current: number;
  limit: number;
  color: string;
  icon?: React.ReactNode;
  showPercentage?: boolean;
  formatValue?: (value: number) => string;
}

export function UsageMeter({
  title,
  current,
  limit,
  color,
  icon,
  showPercentage = false,
  formatValue = (value) => value.toString(),
}: UsageMeterProps) {
  const { theme } = useTheme();
  
  const percentage = Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;

  const getStatusColor = () => {
    if (isAtLimit) return theme.colors.error;
    if (isNearLimit) return theme.colors.warning;
    return color;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.usage, { color: theme.colors.textSecondary }]}>
          {showPercentage 
            ? `${percentage.toFixed(1)}%`
            : `${formatValue(current)} / ${formatValue(limit)}`
          }
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${percentage}%`,
                backgroundColor: getStatusColor()
              }
            ]} 
          />
        </View>
        
        {isAtLimit && (
          <Text style={[styles.warningText, { color: theme.colors.error }]}>
            Quota exceeded
          </Text>
        )}
        
        {isNearLimit && !isAtLimit && (
          <Text style={[styles.warningText, { color: theme.colors.warning }]}>
            Approaching limit
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  usage: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  warningText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'right',
  },
});