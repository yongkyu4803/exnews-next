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
import type { CardProps } from 'antd/lib/card';
import type { FormProps, FormItemProps } from 'antd/lib/form';
import type { InputProps, PasswordProps } from 'antd/lib/input';
import type { RowProps } from 'antd/lib/row';
import type { ColProps } from 'antd/lib/col';
import type { StatisticProps } from 'antd/lib/statistic';
import type { SpinProps } from 'antd/lib/spin';
import type { SelectProps } from 'antd/lib/select';

// Dynamic import types for Ant Design components
export type DynamicTypography = ComponentType<TypographyProps>;
export type DynamicTitle = ComponentType<TitleProps>;
export type DynamicSpace = ComponentType<SpaceProps>;
export type DynamicAlert = ComponentType<AlertProps>;
export type DynamicButton = ComponentType<ButtonProps>;
export type DynamicTabs = ComponentType<TabsProps>;
export type DynamicCard = ComponentType<CardProps>;
export type DynamicForm = ComponentType<FormProps> & {
  Item: ComponentType<FormItemProps>;
  useForm: any;
};
export type DynamicInput = ComponentType<InputProps> & {
  Password: ComponentType<PasswordProps>;
  TextArea: ComponentType<any>;
};
export type DynamicRow = ComponentType<RowProps>;
export type DynamicCol = ComponentType<ColProps>;
export type DynamicStatistic = ComponentType<StatisticProps>;
export type DynamicSpin = ComponentType<SpinProps>;
export type DynamicSelect = ComponentType<SelectProps>;
export type DynamicDatePicker = ComponentType<any> & {
  RangePicker: ComponentType<any>;
};
