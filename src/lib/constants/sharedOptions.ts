import citiesMapData from '../../../cities_map.json';

export interface SelectOption {
  label: string;
  value: string;
}

export const mapOptions = (arr: string[] | undefined): SelectOption[] => 
  Array.isArray(arr) ? arr.map(item => ({ label: item, value: item })) : [];

export const citiesMap = citiesMapData as Record<string, string[]>;

export const getCityOptions = (prefecture: string): SelectOption[] => {
  const cities = citiesMap[prefecture];
  return mapOptions(cities);
};
