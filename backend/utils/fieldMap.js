// Central canonical field mapping to avoid duplicates across controllers/services
export const FIELD_MAP = {
  'computer-science': 'Engineering',
  'cs': 'Engineering',
  'software engineering': 'Engineering',
  'engineering': 'Engineering',
  'it': 'Engineering',
  'business': 'Commerce',
  'commerce': 'Commerce',
  'management': 'Commerce',
  'medicine': 'Medicine',
  'medical': 'Medicine',
  'health sciences': 'Medicine',
  'arts': 'Arts',
  'humanities': 'Arts',
  'natural sciences': 'Science',
  'sciences': 'Science',
  'science': 'Science',
  'law': 'Law',
  'legal studies': 'Law'
};

export function mapField(input) {
  if (!input) return null;
  const key = input.toString().trim().toLowerCase();
  return FIELD_MAP[key] || capitalizeFirst(input);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
