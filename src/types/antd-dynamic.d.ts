/**
 * Type definitions for dynamically imported Ant Design components
 */

import type { ComponentType } from 'react';
import type { TypographyProps } from 'antd/lib/typography';
import type { TitleProps } from 'antd/lib/typography/Title';
import type { SpaceProps } from 'antd/lib/space';
import type { AlertProps } from 'antd/lib/alert';
import type { ButtonProps } from 'antd/lib/button';
import type { TabsProps } from 'antd/lib/tabs';

// Dynamic import types for Ant Design components
export type DynamicTypography = ComponentType<TypographyProps>;
export type DynamicTitle = ComponentType<TitleProps>;
export type DynamicSpace = ComponentType<SpaceProps>;
export type DynamicAlert = ComponentType<AlertProps>;
export type DynamicButton = ComponentType<ButtonProps>;
export type DynamicTabs = ComponentType<TabsProps>;
