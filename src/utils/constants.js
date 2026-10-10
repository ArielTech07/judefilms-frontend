export const EVENT_TYPES = [
  { value: 'bodas', label: 'Bodas' },
  { value: 'bautizos', label: 'Bautizos' },
  { value: 'quinceañeros', label: 'Quinceañeros' },
  { value: 'cumpleaños_infantiles', label: 'Cumpleaños Infantiles' },
  { value: 'eventos_corporativos', label: 'Eventos Corporativos' },
  { value: 'otros', label: 'Otros' }
];

export const getEventLabel = (value) => {
  const type = EVENT_TYPES.find(t => t.value === value);
  return type ? type.label : value;
};
