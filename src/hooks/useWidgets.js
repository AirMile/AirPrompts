import { useState, useEffect, useCallback } from 'react';
import { useUserPreferences } from './useUserPreferences.js';

/**
 * Custom hook for managing widget state and functionality
 * Provides a convenient interface for widget management
 * @returns {Object} Widget management functions and state
 */
export const useWidgets = () => {
  const { dashboard, updateDashboard } = useUserPreferences();
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [widgetConfigs, setWidgetConfigs] = useState({});

  // Default widget configurations
  const defaultWidgetConfigs = {
    'favorites-widget': {
      maxItems: 5,
      showDescription: true,
      showTags: true,
      sortBy: 'name',
      filterType: 'all'
    },
    'recent-widget': {
      maxItems: 10,
      timeRange: 'week',
      showDescription: true,
      showLastUsed: true,
      sortBy: 'recent',
      filterType: 'all'
    },
    'stats-widget': {
      timeRange: 'month',
      showCharts: true,
      showDetails: true,
      metrics: ['usage', 'favorites', 'categories']
    },
    'quick-actions-widget': {
      actions: ['new-template', 'new-workflow', 'search', 'favorites'],
      showLabels: true,
      buttonSize: 'medium'
    }
  };

  // Update widget configurations when dashboard changes
  useEffect(() => {
    if (dashboard.widgets) {
      setWidgetConfigs(dashboard.widgets);
      setActiveWidgets(
        Object.keys(dashboard.widgets).filter(
          widgetId => dashboard.widgets[widgetId].enabled
        )
      );
    }
  }, [dashboard.widgets]);

  /**
   * Get widget configuration with defaults
   * @param {string} widgetId - Widget ID
   * @returns {Object} Widget configuration
   */
  const getWidgetConfig = useCallback((widgetId) => {
    const userConfig = dashboard.widgets?.[widgetId] || {};
    const defaultConfig = defaultWidgetConfigs[widgetId] || {};
    
    return {
      ...defaultConfig,
      ...userConfig,
      enabled: userConfig.enabled !== undefined ? userConfig.enabled : false,
      position: userConfig.position || { x: 0, y: 0 },
      size: userConfig.size || { width: 300, height: 200 }
    };
  }, [dashboard.widgets, defaultWidgetConfigs]);

  /**
   * Update widget configuration
   * @param {string} widgetId - Widget ID
   * @param {Object} updates - Configuration updates
   */
  const updateWidgetConfig = useCallback((widgetId, updates) => {
    const currentConfig = getWidgetConfig(widgetId);
    const newConfig = { ...currentConfig, ...updates };
    
    updateDashboard({
      widgets: {
        ...dashboard.widgets,
        [widgetId]: newConfig
      }
    });
  }, [dashboard.widgets, getWidgetConfig, updateDashboard]);

  /**
   * Enable a widget
   * @param {string} widgetId - Widget ID
   */
  const enableWidget = useCallback((widgetId) => {
    updateWidgetConfig(widgetId, { enabled: true });
  }, [updateWidgetConfig]);

  /**
   * Disable a widget
   * @param {string} widgetId - Widget ID
   */
  const disableWidget = useCallback((widgetId) => {
    updateWidgetConfig(widgetId, { enabled: false });
  }, [updateWidgetConfig]);

  /**
   * Toggle widget enabled state
   * @param {string} widgetId - Widget ID
   */
  const toggleWidget = useCallback((widgetId) => {
    const currentConfig = getWidgetConfig(widgetId);
    updateWidgetConfig(widgetId, { enabled: !currentConfig.enabled });
  }, [getWidgetConfig, updateWidgetConfig]);

  /**
   * Update widget position
   * @param {string} widgetId - Widget ID
   * @param {Object} position - New position {x, y}
   */
  const updateWidgetPosition = useCallback((widgetId, position) => {
    updateWidgetConfig(widgetId, { position });
  }, [updateWidgetConfig]);

  /**
   * Update widget size
   * @param {string} widgetId - Widget ID
   * @param {Object} size - New size {width, height}
   */
  const updateWidgetSize = useCallback((widgetId, size) => {
    updateWidgetConfig(widgetId, { size });
  }, [updateWidgetConfig]);

  /**
   * Reset widget to defaults
   * @param {string} widgetId - Widget ID
   */
  const resetWidget = useCallback((widgetId) => {
    const defaultConfig = defaultWidgetConfigs[widgetId] || {};
    updateWidgetConfig(widgetId, {
      ...defaultConfig,
      position: { x: 0, y: 0 },
      size: { width: 300, height: 200 },
      maximized: false
    });
  }, [updateWidgetConfig, defaultWidgetConfigs]);

  /**
   * Reset all widgets to defaults
   */
  const resetAllWidgets = useCallback(() => {
    const resetConfigs = {};
    Object.keys(dashboard.widgets || {}).forEach(widgetId => {
      const defaultConfig = defaultWidgetConfigs[widgetId] || {};
      resetConfigs[widgetId] = {
        ...defaultConfig,
        enabled: dashboard.widgets[widgetId].enabled || false,
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
        maximized: false
      };
    });
    
    updateDashboard({
      widgets: resetConfigs
    });
  }, [dashboard.widgets, updateDashboard, defaultWidgetConfigs]);

  /**
   * Get all enabled widgets
   * @returns {Array} Array of enabled widget IDs
   */
  const getEnabledWidgets = useCallback(() => {
    return Object.keys(dashboard.widgets || {}).filter(
      widgetId => dashboard.widgets[widgetId].enabled
    );
  }, [dashboard.widgets]);

  /**
   * Check if a widget is enabled
   * @param {string} widgetId - Widget ID
   * @returns {boolean} Whether the widget is enabled
   */
  const isWidgetEnabled = useCallback((widgetId) => {
    return getWidgetConfig(widgetId).enabled;
  }, [getWidgetConfig]);

  /**
   * Get widget layout info for positioning
   * @returns {Object} Layout information
   */
  const getWidgetLayout = useCallback(() => {
    const enabledWidgets = getEnabledWidgets();
    const layout = {
      totalWidgets: enabledWidgets.length,
      positions: {},
      sizes: {}
    };
    
    enabledWidgets.forEach(widgetId => {
      const config = getWidgetConfig(widgetId);
      layout.positions[widgetId] = config.position;
      layout.sizes[widgetId] = config.size;
    });
    
    return layout;
  }, [getEnabledWidgets, getWidgetConfig]);

  /**
   * Auto-arrange widgets in a grid layout
   * @param {Object} options - Layout options
   */
  const autoArrangeWidgets = useCallback((options = {}) => {
    const { 
      startX = 20, 
      startY = 20, 
      spacing = 20, 
      columns = 3,
      defaultWidth = 300,
      defaultHeight = 200
    } = options;
    
    const enabledWidgets = getEnabledWidgets();
    const updates = {};
    
    enabledWidgets.forEach((widgetId, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      const x = startX + (col * (defaultWidth + spacing));
      const y = startY + (row * (defaultHeight + spacing));
      
      updates[widgetId] = {
        ...getWidgetConfig(widgetId),
        position: { x, y },
        size: { width: defaultWidth, height: defaultHeight }
      };
    });
    
    updateDashboard({
      widgets: {
        ...dashboard.widgets,
        ...updates
      }
    });
  }, [getEnabledWidgets, getWidgetConfig, dashboard.widgets, updateDashboard]);

  return {
    // State
    activeWidgets,
    widgetConfigs,
    
    // Configuration
    getWidgetConfig,
    updateWidgetConfig,
    
    // Enable/Disable
    enableWidget,
    disableWidget,
    toggleWidget,
    isWidgetEnabled,
    getEnabledWidgets,
    
    // Position/Size
    updateWidgetPosition,
    updateWidgetSize,
    
    // Reset
    resetWidget,
    resetAllWidgets,
    
    // Layout
    getWidgetLayout,
    autoArrangeWidgets
  };
};