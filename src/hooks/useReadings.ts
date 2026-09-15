import { useState, useEffect, useCallback } from 'react';
import {
  BloodPressureRecord,
  getAllReadings,
  addReading as serviceAddReading,
  updateReading as serviceUpdateReading,
  deleteReading as serviceDeleteReading,
} from '../services/readingsService';

export function useReadings() {
  const [readings, setReadings] = useState<BloodPressureRecord[]>([]);

  const loadReadings = useCallback(async () => {
    const data = await getAllReadings();
    setReadings(data);
    return data;
  }, []);

  useEffect(() => {
    loadReadings();
  }, [loadReadings]);

  const addReading = useCallback(
    async (data: Omit<BloodPressureRecord, 'id' | 'period'>) => {
      const id = await serviceAddReading(data);
      await loadReadings();
      return id;
    },
    [loadReadings]
  );

  const updateReading = useCallback(
    async (id: number, data: Partial<Omit<BloodPressureRecord, 'id'>>) => {
      const res = await serviceUpdateReading(id, data);
      await loadReadings();
      return res;
    },
    [loadReadings]
  );

  const deleteReading = useCallback(
    async (id: number) => {
      await serviceDeleteReading(id);
      await loadReadings();
    },
    [loadReadings]
  );

  return {
    readings,
    loadReadings,
    addReading,
    updateReading,
    deleteReading,
  };
}

export default useReadings;
