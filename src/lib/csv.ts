import Papa from 'papaparse';
import type { Person, PersonDraft } from '@/types';
import { isValidZone } from './time';

const HEADERS = ['name', 'role', 'timezoneId', 'city', 'lat', 'lng'] as const;

function escape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(people: Person[]): string {
  const rows = people.map((p) =>
    [p.name, p.role, p.timezoneId, p.city, p.lat?.toString() ?? '', p.lng?.toString() ?? '']
      .map(escape)
      .join(','),
  );
  return [HEADERS.join(','), ...rows].join('\n');
}

export function downloadCsv(people: Person[]): void {
  const blob = new Blob([toCsv(people)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'teamzone.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  people: PersonDraft[];
  errors: string[];
}

export function parseCsvFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const people: PersonDraft[] = [];
        const errors: string[] = [];

        result.data.forEach((row, i) => {
          const line = i + 2; // header is line 1
          const name = row.name?.trim();
          const timezoneId = row.timezoneId?.trim();
          if (!name) {
            errors.push(`Line ${line}: missing name`);
            return;
          }
          if (!timezoneId || !isValidZone(timezoneId)) {
            errors.push(`Line ${line} (${name}): invalid timezone "${timezoneId ?? ''}"`);
            return;
          }
          const lat = row.lat?.trim() ? Number(row.lat) : null;
          const lng = row.lng?.trim() ? Number(row.lng) : null;
          const hasCoords =
            lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng) &&
            Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
          people.push({
            name,
            role: row.role?.trim() ?? '',
            timezoneId,
            city: row.city?.trim() ?? '',
            lat: hasCoords ? lat : null,
            lng: hasCoords ? lng : null,
            approximate: !hasCoords,
          });
        });

        resolve({ people, errors });
      },
      error: () => resolve({ people: [], errors: ['Could not read the file as CSV.'] }),
    });
  });
}
