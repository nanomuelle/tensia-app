import React from 'react';
import { getCategory, BloodPressureCategory } from '../services/readingsService';

export interface ReadingCategoryBadgeProps {
  systolic?: number;
  diastolic?: number;
  category?: BloodPressureCategory;
  className?: string;
}

export const ReadingCategoryBadge: React.FC<ReadingCategoryBadgeProps> = ({
  systolic,
  diastolic,
  category,
  className = '',
}) => {
  const cat =
    category ||
    (systolic !== undefined && diastolic !== undefined
      ? getCategory(systolic, diastolic)
      : null);

  if (!cat) return null;

  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${cat.color} ${className}`.trim()}
    >
      {cat.label}
    </span>
  );
};

export default ReadingCategoryBadge;
